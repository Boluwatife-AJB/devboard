use std::sync::Arc;

use devboard_cache::{MessageBus, MessagingEvent};
use devboard_domain::{
    Channel, ChannelId, ChannelKind, ChannelMember, DmMessage, DmMessageId, DmThread, DmThreadId,
    Message, MessageId, OrganizationId, PresenceStatus, ReactionSummary, UserId,
    messaging::is_allowed_reaction,
};
use devboard_presence::PresenceService;
use devboard_repository::{
    OrgMembershipRepository, RepositoryError,
    messaging::{
        ChannelRepository, CreateChannelParams, CreateMessageParams, DmRepository,
        MessageRepository,
    },
};
use tokio::sync::mpsc;

use crate::ServiceError;

pub struct UnfurlJob {
    pub message_id: MessageId,
    pub body: String,
}

/*
TODO:
1. Add member to channel
2. Leave channel
3. Remove member from channel
4. Clear channel message for a user
5. Clear dm messages for a user
6. Share media
 */

pub struct MessagingService {
    channel_repo: Arc<dyn ChannelRepository>,
    message_repo: Arc<dyn MessageRepository>,
    dm_repo: Arc<dyn DmRepository>,
    org_member_repo: Arc<dyn OrgMembershipRepository>,
    message_bus: Arc<MessageBus>,
    presence: Arc<PresenceService>,
    unfurl_tx: mpsc::Sender<UnfurlJob>,
}

impl MessagingService {
    pub fn new(
        channel_repo: Arc<dyn ChannelRepository>,
        message_repo: Arc<dyn MessageRepository>,
        dm_repo: Arc<dyn DmRepository>,
        org_member_repo: Arc<dyn OrgMembershipRepository>,
        message_bus: Arc<MessageBus>,
        presence: Arc<PresenceService>,
        unfurl_tx: mpsc::Sender<UnfurlJob>,
    ) -> Self {
        Self {
            channel_repo,
            message_repo,
            dm_repo,
            org_member_repo,
            message_bus,
            presence,
            unfurl_tx,
        }
    }

    pub async fn list_channels(
        &self,
        org_id: OrganizationId,
        caller_id: UserId,
    ) -> Result<Vec<(Channel, bool)>, ServiceError> {
        self.require_org_member(caller_id, org_id).await?;

        let all = self
            .channel_repo
            .find_by_organization(org_id)
            .await
            .map_err(ServiceError::from)?;

        let member_channels = self
            .channel_repo
            .find_member_channels(caller_id, org_id)
            .await
            .map_err(ServiceError::from)?;

        let member_ids: std::collections::HashSet<_> = member_channels
            .into_iter()
            .map(|channel| channel.id)
            .collect();

        Ok(all
            .into_iter()
            .filter(|channel| channel.kind == ChannelKind::Open || member_ids.contains(&channel.id))
            .map(|channel| {
                let is_member = member_ids.contains(&channel.id);
                (channel, is_member)
            })
            .collect())
    }

    pub async fn create_channel(
        &self,
        org_id: OrganizationId,
        caller_id: UserId,
        slug: String,
        name: String,
        description: Option<String>,
        kind: ChannelKind,
    ) -> Result<Channel, ServiceError> {
        self.require_org_admin(caller_id, org_id).await?;

        validate_channel_slug(&slug)?;
        validate_channel_name(&name)?;

        let channel_id = ChannelId::new();

        let channel = self
            .channel_repo
            .create(CreateChannelParams {
                id: channel_id,
                org_id,
                created_by: caller_id,
                slug,
                name,
                description,
                kind,
            })
            .await
            .map_err(|err| match err {
                RepositoryError::UniqueViolation { .. } => ServiceError::Conflict {
                    message: "a channel with this slug already exists in the organization".into(),
                },
                other => ServiceError::from(other),
            })?;

        self.channel_repo
            .add_member(channel_id, caller_id)
            .await
            .map_err(ServiceError::from)?;

        Ok(channel)
    }

    pub async fn list_channel_members(
        &self,
        channel_id: ChannelId,
        caller_id: UserId,
    ) -> Result<Vec<ChannelMember>, ServiceError> {
        self.require_channel_member(channel_id, caller_id).await?;

        self.channel_repo
            .list_members(channel_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn join_channel(
        &self,
        channel_id: ChannelId,
        caller_id: UserId,
        org_id: OrganizationId,
    ) -> Result<ChannelMember, ServiceError> {
        self.require_org_member(caller_id, org_id).await?;

        let channel = self
            .channel_repo
            .find_by_id(channel_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("channel not found".into()))?;

        if channel.organization_id != org_id {
            return Err(ServiceError::Forbidden {
                reason: "this channel is not part of this organization".into(),
            });
        }

        if channel.kind == ChannelKind::Private {
            self.require_org_admin(caller_id, org_id).await?;
        }

        self.channel_repo
            .add_member(channel_id, caller_id)
            .await
            .map_err(|err| match err {
                RepositoryError::UniqueViolation { .. } => ServiceError::Conflict {
                    message: "you are already a member of this channel".into(),
                },
                other => ServiceError::from(other),
            })
    }

    pub async fn add_channel_member(
        &self,
        channel_id: ChannelId,
        caller_id: UserId,
        target_user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<ChannelMember, ServiceError> {
        self.require_org_admin(caller_id, org_id).await?;
        self.require_org_member(target_user_id, org_id).await?;

        let channel = self
            .channel_repo
            .find_by_id(channel_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("channel not found".into()))?;

        if channel.organization_id != org_id {
            return Err(ServiceError::Forbidden {
                reason: "this channel is not part of this organization".into(),
            });
        }

        self.channel_repo
            .add_member(channel_id, target_user_id)
            .await
            .map_err(|err| match err {
                RepositoryError::UniqueViolation { .. } => ServiceError::Conflict {
                    message: "the user is already a member of this channel".into(),
                },
                other => ServiceError::from(other),
            })
    }

    pub async fn leave_channel(
        &self,
        channel_id: ChannelId,
        caller_id: UserId,
        org_id: OrganizationId,
    ) -> Result<(), ServiceError> {
        self.require_org_member(caller_id, org_id).await?;

        let channel = self
            .channel_repo
            .find_by_id(channel_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("channel not found".into()))?;

        if channel.organization_id != org_id {
            return Err(ServiceError::Forbidden {
                reason: "this channel is not part of this organization".into(),
            });
        }

        self.require_channel_member(channel_id, caller_id).await?;

        self.channel_repo
            .remove_member(channel_id, caller_id)
            .await
            .map_err(map_remove_member_error)
    }

    pub async fn remove_channel_member(
        &self,
        channel_id: ChannelId,
        caller_id: UserId,
        target_user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<(), ServiceError> {
        self.require_org_admin(caller_id, org_id).await?;

        let channel = self
            .channel_repo
            .find_by_id(channel_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("channel not found".into()))?;

        if channel.organization_id != org_id {
            return Err(ServiceError::Forbidden {
                reason: "this channel is not part of this organization".into(),
            });
        }

        if target_user_id == caller_id {
            return Err(ServiceError::Validation {
                field: "userId".into(),
                message: "use leaveChannel to leave yourself".into(),
            });
        }

        self.channel_repo
            .remove_member(channel_id, target_user_id)
            .await
            .map_err(map_remove_member_error)
    }

    // Messages
    pub async fn list_messages(
        &self,
        channel_id: ChannelId,
        caller_id: UserId,
        before_id: Option<MessageId>,
        limit: u64,
    ) -> Result<Vec<Message>, ServiceError> {
        self.require_channel_member(channel_id, caller_id).await?;

        let limit = limit.clamp(1, 100);

        self.message_repo
            .find_by_channel(channel_id, before_id, limit)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn list_dm_threads(&self, caller_id: UserId) -> Result<Vec<DmThread>, ServiceError> {
        self.dm_repo
            .find_user_threads(caller_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn send_message(
        &self,
        channel_id: ChannelId,
        author_id: UserId,
        body: String,
    ) -> Result<Message, ServiceError> {
        validate_message_body(&body)?;
        self.require_channel_member(channel_id, author_id).await?;

        let message = self
            .message_repo
            .create(CreateMessageParams {
                id: MessageId::new(),
                channel_id,
                author_id,
                body: body.clone(),
            })
            .await
            .map_err(ServiceError::from)?;

        let _ = self
            .message_bus
            .publish(&MessagingEvent::ChannelMessage {
                channel_id,
                message: message.clone(),
            })
            .await;

        if contains_url(&body) {
            let _ = self.unfurl_tx.try_send(UnfurlJob {
                message_id: message.id,
                body,
            });
        }

        Ok(message)
    }

    pub async fn edit_message(
        &self,
        message_id: MessageId,
        caller_id: UserId,
        new_body: String,
    ) -> Result<Message, ServiceError> {
        validate_message_body(&new_body)?;

        let message = self
            .message_repo
            .find_by_id(message_id)
            .await?
            .ok_or(ServiceError::Internal("message not found".into()))?;

        if message.author_id != caller_id {
            return Err(ServiceError::Forbidden {
                reason: "you are not the author of this message".into(),
            });
        }

        let updated_message = self
            .message_repo
            .update_body(message_id, new_body)
            .await
            .map_err(ServiceError::from)?;

        let _ = self
            .message_bus
            .publish(&MessagingEvent::ChannelMessageEdited {
                channel_id: updated_message.channel_id,
                message: updated_message.clone(),
            })
            .await;

        Ok(updated_message)
    }

    pub async fn delete_message(
        &self,
        message_id: MessageId,
        caller_id: UserId,
        org_id: OrganizationId,
    ) -> Result<(), ServiceError> {
        let message = self
            .message_repo
            .find_by_id(message_id)
            .await?
            .ok_or(ServiceError::Internal("message not found".into()))?;

        let is_author = message.author_id == caller_id;

        if !is_author {
            self.require_org_admin(caller_id, org_id).await?;
        }

        let channel_id = message.channel_id;

        self.message_repo
            .delete(message_id)
            .await
            .map_err(ServiceError::from)?;

        let _ = self
            .message_bus
            .publish(&MessagingEvent::ChannelMessageDeleted {
                channel_id,
                message_id,
            })
            .await;

        Ok(())
    }

    // Reactions
    pub async fn add_reaction(
        &self,
        message_id: MessageId,
        caller_id: UserId,
        emoji: String,
    ) -> Result<Vec<ReactionSummary>, ServiceError> {
        if !is_allowed_reaction(&emoji) {
            return Err(ServiceError::Validation {
                field: "emoji".into(),
                message: format!("'{}' is not in the allowed reaction set", emoji),
            });
        }

        let message = self
            .message_repo
            .find_by_id(message_id)
            .await?
            .ok_or(ServiceError::Internal("message not found".into()))?;

        self.message_repo
            .add_reaction(message_id, caller_id, emoji)
            .await
            .map_err(ServiceError::from)?;

        let _ = self
            .message_bus
            .publish(&MessagingEvent::ReactionUpdated {
                channel_id: message.channel_id,
                message_id,
            })
            .await;

        self.message_repo
            .get_reactions(message_id, caller_id)
            .await
            .map_err(ServiceError::from)
    }

    /// Reaction summaries for a message (used by GraphQL field resolvers).
    pub async fn get_reactions(
        &self,
        message_id: MessageId,
        caller_id: UserId,
    ) -> Result<Vec<ReactionSummary>, ServiceError> {
        let message = self
            .message_repo
            .find_by_id(message_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("message not found".into()))?;

        self.require_channel_member(message.channel_id, caller_id)
            .await?;

        self.message_repo
            .get_reactions(message_id, caller_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn remove_reaction(
        &self,
        message_id: MessageId,
        caller_id: UserId,
        emoji: String,
    ) -> Result<Vec<ReactionSummary>, ServiceError> {
        let message = self
            .message_repo
            .find_by_id(message_id)
            .await?
            .ok_or(ServiceError::Internal("message not found".into()))?;

        self.message_repo
            .remove_reaction(message_id, caller_id, emoji)
            .await
            .map_err(ServiceError::from)?;

        let _ = self
            .message_bus
            .publish(&MessagingEvent::ReactionUpdated {
                channel_id: message.channel_id,
                message_id,
            })
            .await;

        self.message_repo
            .get_reactions(message_id, caller_id)
            .await
            .map_err(ServiceError::from)
    }

    // Read receipts
    pub async fn mark_channel_read(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
        message_id: MessageId,
    ) -> Result<(), ServiceError> {
        self.require_channel_member(channel_id, user_id).await?;

        self.channel_repo
            .update_last_read(channel_id, user_id, message_id)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn get_unread_count(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<u64, ServiceError> {
        let member = self
            .channel_repo
            .get_member(channel_id, user_id)
            .await
            .map_err(ServiceError::from)?;

        let last_read = member.and_then(|m| m.last_read_message_id);

        self.message_repo
            .unread_count(channel_id, last_read)
            .await
            .map_err(ServiceError::from)
    }

    // Dms
    pub async fn get_or_create_dm_thread(
        &self,
        caller_id: UserId,
        other_id: UserId,
        org_id: OrganizationId,
    ) -> Result<DmThread, ServiceError> {
        self.require_org_member(caller_id, org_id).await?;
        self.require_org_member(other_id, org_id).await?;

        if let Some(thread) = self
            .dm_repo
            .find_thread(caller_id, other_id)
            .await
            .map_err(ServiceError::from)?
        {
            return Ok(thread);
        }

        self.dm_repo
            .create_thread(DmThreadId::new(), caller_id, other_id)
            .await
            .map_err(|err| match err {
                RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Internal("thread creation race condition".into())
                }
                other => ServiceError::from(other),
            })
    }

    pub async fn list_dm_messages(
        &self,
        thread_id: DmThreadId,
        caller_id: UserId,
        before_id: Option<DmMessageId>,
        limit: u64,
    ) -> Result<Vec<DmMessage>, ServiceError> {
        let thread = self
            .dm_repo
            .find_thread_by_id(thread_id)
            .await?
            .ok_or(ServiceError::Internal("thread not found".into()))?;

        if thread.participant_a != caller_id && thread.participant_b != caller_id {
            return Err(ServiceError::Forbidden {
                reason: "you are not a participant of this DM thread".into(),
            });
        }

        let limit = limit.clamp(1, 100);

        self.dm_repo
            .find_messages(thread_id, before_id, limit)
            .await
            .map_err(ServiceError::from)
    }

    pub async fn send_dm(
        &self,
        thread_id: DmThreadId,
        author_id: UserId,
        body: String,
    ) -> Result<DmMessage, ServiceError> {
        validate_message_body(&body)?;

        let thread = self
            .dm_repo
            .find_thread_by_id(thread_id)
            .await?
            .ok_or(ServiceError::Internal("thread not found".into()))?;

        if thread.participant_a != author_id && thread.participant_b != author_id {
            return Err(ServiceError::Forbidden {
                reason: "you are not a participant of this DM thread".into(),
            });
        }

        let message = self
            .dm_repo
            .create_message(DmMessageId::new(), thread_id, author_id, body)
            .await
            .map_err(ServiceError::from)?;

        let _ = self
            .message_bus
            .publish(&MessagingEvent::DmReceived {
                thread_id,
                message: message.clone(),
            })
            .await;

        Ok(message)
    }

    pub async fn mark_dm_read(
        &self,
        thread_id: DmThreadId,
        reader_id: UserId,
    ) -> Result<(), ServiceError> {
        self.dm_repo
            .mark_read(thread_id, reader_id)
            .await
            .map_err(ServiceError::from)
    }

    // Presence
    pub async fn heartbeat(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        status: PresenceStatus,
    ) -> Result<(), ServiceError> {
        self.require_org_member(user_id, org_id).await?;

        self.presence
            .heartbeat(user_id, status)
            .await
            .map_err(|err| ServiceError::Internal(err.to_string()))?;

        let _ = self
            .message_bus
            .publish(&MessagingEvent::PresenceChanged {
                org_id,
                user_id,
                status,
            })
            .await;
        Ok(())
    }

    /// Snapshot of presence for all members of an organization.
    pub async fn list_org_presence(
        &self,
        caller_id: UserId,
        org_id: OrganizationId,
    ) -> Result<Vec<devboard_domain::UserPresence>, ServiceError> {
        self.require_org_member(caller_id, org_id).await?;

        let members = self
            .org_member_repo
            .list_by_org(org_id)
            .await
            .map_err(ServiceError::from)?;

        let user_ids = members.into_iter().map(|m| m.user_id).collect();
        self.presence
            .get_many(user_ids)
            .await
            .map_err(|err| ServiceError::Internal(err.to_string()))
    }

    // Private Helpers
    async fn require_org_member(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<(), ServiceError> {
        self.org_member_repo
            .find(user_id, org_id)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::Forbidden {
                reason: "not a member of this organization".into(),
            })?;
        Ok(())
    }

    async fn require_org_admin(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<(), ServiceError> {
        let membership = self
            .org_member_repo
            .find(user_id, org_id)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::Forbidden {
                reason: "not a member of this organization".into(),
            })?;

        if !membership.role.at_least(devboard_domain::OrgRole::OrgAdmin) {
            return Err(ServiceError::Forbidden {
                reason: "requires organization admin privileges".into(),
            });
        }

        Ok(())
    }

    async fn require_channel_member(
        &self,
        channel_id: ChannelId,
        user_id: UserId,
    ) -> Result<(), ServiceError> {
        self.channel_repo
            .get_member(channel_id, user_id)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::Forbidden {
                reason: "not a member of this channel".into(),
            })?;
        Ok(())
    }
}

fn validate_message_body(body: &str) -> Result<(), ServiceError> {
    if body.trim().is_empty() {
        return Err(ServiceError::Validation {
            field: "body".into(),
            message: "message body cannot be empty".into(),
        });
    }
    if body.len() > 10_000 {
        return Err(ServiceError::Validation {
            field: "body".into(),
            message: "message body cannot be longer than 10,000 characters".into(),
        });
    }
    Ok(())
}

fn validate_channel_slug(slug: &str) -> Result<(), ServiceError> {
    if slug.trim().is_empty() {
        return Err(ServiceError::Validation {
            field: "slug".into(),
            message: "channel slug cannot be empty".into(),
        });
    }
    if !slug
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(ServiceError::Validation {
            field: "slug".into(),
            message: "channel slug can only contain lowercase letters, digits, and hyphens".into(),
        });
    }
    if slug.len() > 80 {
        return Err(ServiceError::Validation {
            field: "slug".into(),
            message: "channel slug cannot be longer than 80 characters".into(),
        });
    }
    Ok(())
}

fn validate_channel_name(name: &str) -> Result<(), ServiceError> {
    if name.trim().is_empty() {
        return Err(ServiceError::Validation {
            field: "name".into(),
            message: "channel name cannot be empty".into(),
        });
    }
    if name.len() > 100 {
        return Err(ServiceError::Validation {
            field: "name".into(),
            message: "channel name cannot be longer than 100 characters".into(),
        });
    }
    Ok(())
}

fn map_remove_member_error(err: RepositoryError) -> ServiceError {
    match err {
        RepositoryError::NotFound => ServiceError::Conflict {
            message: "user is not a member of this channel".into(),
        },
        other => ServiceError::from(other),
    }
}

fn contains_url(body: &str) -> bool {
    body.contains("http://") || body.contains("https://")
}
