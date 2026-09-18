use std::sync::Arc;

use devboard_cache::OrgMembershipCache;
use devboard_domain::{OrgMemberProfile, OrgSummary, OrganizationId, UserId};
use devboard_repository::{OrgMembershipRepository, UserRepository};

use crate::ServiceError;

pub struct ProfileService {
    user_repo: Arc<dyn UserRepository>,
    org_membership_repo: Arc<dyn OrgMembershipRepository>,
    membership_cache: Arc<OrgMembershipCache>,
}

impl ProfileService {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        org_membership_repo: Arc<dyn OrgMembershipRepository>,
        membership_cache: Arc<OrgMembershipCache>,
    ) -> Self {
        Self {
            user_repo,
            org_membership_repo,
            membership_cache,
        }
    }

    pub async fn list_my_organizations(
        &self,
        user_id: UserId,
    ) -> Result<Vec<OrgSummary>, ServiceError> {
        self.org_membership_repo
            .find_all_for_user(user_id)
            .await
            .map_err(Into::into)
    }

    pub async fn get_my_org_profile(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<OrgMemberProfile, ServiceError> {
        let (user, membership) = tokio::try_join!(
            self.user_repo.find_by_id(user_id),
            self.org_membership_repo.find(user_id, org_id),
        )?;

        let user = user.ok_or(ServiceError::Unauthenticated)?;
        let membership = membership.ok_or(ServiceError::Forbidden {
            reason: "you are not a member of this organization".into(),
        })?;

        Ok(OrgMemberProfile {
            organization_id: membership.organization_id,
            user_id: membership.user_id,
            email: user.email,
            display_name: membership.display_name,
            avatar_url: membership.avatar_url,
            role: membership.role,
            joined_at: membership.joined_at,
        })
    }

    pub async fn update_my_org_profile(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        display_name: String,
        avatar_url: Option<String>,
    ) -> Result<OrgMemberProfile, ServiceError> {
        validate_display_name(&display_name)?;
        if let Some(ref url) = avatar_url {
            validate_avatar_url(url)?;
        }

        let _ = self
            .org_membership_repo
            .find(user_id, org_id)
            .await?
            .ok_or(ServiceError::Forbidden {
                reason: "you are not a member of this organization".into(),
            })?;

        let membership = self
            .org_membership_repo
            .update_profile(user_id, org_id, display_name, avatar_url)
            .await?;

        let _ = self.membership_cache.invalidate(user_id, org_id).await;

        let user = self
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;

        Ok(OrgMemberProfile {
            organization_id: membership.organization_id,
            user_id: membership.user_id,
            email: user.email,
            display_name: membership.display_name,
            avatar_url: membership.avatar_url,
            role: membership.role,
            joined_at: membership.joined_at,
        })
    }
}

fn validate_display_name(name: &str) -> Result<(), ServiceError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(ServiceError::Validation {
            field: "displayName".into(),
            message: "display name is required".into(),
        });
    }
    if trimmed.len() > 100 {
        return Err(ServiceError::Validation {
            field: "displayName".into(),
            message: "display name must be at most 100 characters".into(),
        });
    }
    Ok(())
}

fn validate_avatar_url(url: &str) -> Result<(), ServiceError> {
    if url.len() > 2048 {
        return Err(ServiceError::Validation {
            field: "avatarUrl".into(),
            message: ("avatar URL is too long".into()),
        });
    }
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err(ServiceError::Validation {
            field: "avatarUrl".into(),
            message: ("avatar URL must be an http(s) URL".into()),
        });
    }
    Ok(())
}
