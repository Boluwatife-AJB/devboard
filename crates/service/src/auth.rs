use chrono::{Duration, Utc};
use std::sync::Arc;

use devboard_auth::{JwtService, hash_password, verify_password};
use devboard_domain::{
    Invitation, InvitationId, InvitationStatus, OrgRole, OrgSummary, OrganizationId, PublicUser,
    UserId,
};
use devboard_email::{EmailProvider, templates::InviteEmailData};
use devboard_repository::{
    OrganizationRepository, UserRepository,
    invitation::{InvitationRepository, NewInvitation},
    org_membership::OrgMembershipRepository,
};

use crate::error::ServiceError;

#[derive(Debug, Clone)]
pub struct AuthPayload {
    pub access_token: String,
    pub user: PublicUser,
    pub organizations: Vec<OrgSummary>,
}

#[derive(Debug, Clone)]
pub struct CreateInviteResult {
    pub invite_url: String,
    pub email_sent: bool,
}

#[derive(Debug, Clone)]
pub struct PendingInvitationView {
    pub invitation: Invitation,
    pub invite_url: String,
}

#[derive(Debug, Clone)]
pub struct InvitePreview {
    pub email: String,
    pub org_name: String,
    pub role: OrgRole,
    pub expires_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub enum RegistrationIntent {
    CreateOrganization { name: String, slug: String },
    AcceptInvite { token: String },
}

pub struct AuthService {
    user_repo: Arc<dyn UserRepository>,
    org_repo: Arc<dyn OrganizationRepository>,
    org_membership_repo: Arc<dyn OrgMembershipRepository>,
    invitation_repo: Arc<dyn InvitationRepository>,
    email_provider: Arc<dyn EmailProvider>,
    jwt: Arc<JwtService>,
    app_base_url: String,
}

impl AuthService {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        org_repo: Arc<dyn OrganizationRepository>,
        org_membership_repo: Arc<dyn OrgMembershipRepository>,
        invitation_repo: Arc<dyn InvitationRepository>,
        email_provider: Arc<dyn EmailProvider>,
        jwt: Arc<JwtService>,
        app_base_url: String,
    ) -> Self {
        Self {
            user_repo,
            org_repo,
            org_membership_repo,
            invitation_repo,
            email_provider,
            jwt,
            app_base_url,
        }
    }

    #[tracing::instrument(
      skip(self, password),
      fields(email = %email)
    )]
    pub async fn register(
        &self,
        email: String,
        display_name: String,
        password: String,
        intent: RegistrationIntent,
    ) -> Result<AuthPayload, ServiceError> {
        validate_email(&email)?;
        validate_password(&password)?;

        let password_hash = hash_password(password).await.map_err(ServiceError::from)?;

        let user_id = UserId::new();

        let user = self
            .user_repo
            .create(user_id, email.clone(), display_name, password_hash)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Conflict {
                        message: "an account with this email already exists".into(),
                    }
                }
                other => ServiceError::from(other),
            })?;

        match intent {
            RegistrationIntent::CreateOrganization { name, slug } => {
                self.handle_create_org(user.id, name, slug).await?;
            }
            RegistrationIntent::AcceptInvite { token } => {
                self.handle_accept_invite_for_new_user(user.id, &email, &token)
                    .await?;
            }
        }

        self.build_auth_payload(user.into()).await
    }

    #[tracing::instrument(
      skip(self, password),
      fields(email = %email)
    )]
    pub async fn login(
        &self,
        email: String,
        password: String,
    ) -> Result<AuthPayload, ServiceError> {
        let user = self
            .user_repo
            .find_by_email(&email)
            .await
            .map_err(ServiceError::from)?
            .ok_or(ServiceError::InvalidCredentials)?;

        verify_password(password, user.password_hash.clone())
            .await
            .map_err(|_| ServiceError::InvalidCredentials)?;

        self.build_auth_payload(user.into()).await
    }

    #[tracing::instrument(skip(self), fields(user_id = %user_id))]
    pub async fn accept_invite_for_existing_user(
        &self,
        user_id: UserId,
        token: &str,
    ) -> Result<OrgSummary, ServiceError> {
        let invitation = self.invitation_repo.find_by_token(token).await?.ok_or(
            ServiceError::InvitationNotFound {
                id: "invitation".into(),
            },
        )?;

        if !invitation.is_valid() {
            return Err(ServiceError::Conflict {
                message: "this invitation has expired or already been used".into(),
            });
        }

        let user = self
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;

        if user.email.to_lowercase() != invitation.email.to_lowercase() {
            return Err(ServiceError::Forbidden {
                reason: "this invitation was sent to a different email address".into(),
            });
        }

        let membership = self
            .org_membership_repo
            .create(user_id, invitation.organization_id, invitation.role)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Conflict {
                        message: "you are already a member of this organization".into(),
                    }
                }
                other => ServiceError::from(other),
            })?;

        self.invitation_repo.mark_accepted(invitation.id).await?;

        let org = self
            .org_repo
            .find_by_id(invitation.organization_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("org not found".into()))?;

        Ok(OrgSummary {
            id: org.id,
            name: org.name,
            slug: org.slug,
            role: membership.role,
        })
    }

    #[tracing::instrument(
        skip(self),
        fields(caller_id = %caller_id, email = %email)
    )]
    pub async fn create_invite(
        &self,
        caller_id: UserId,
        org_id: OrganizationId,
        email: String,
        role: OrgRole,
    ) -> Result<CreateInviteResult, ServiceError> {
        let caller_membership = self
            .org_membership_repo
            .find(caller_id, org_id)
            .await?
            .ok_or(ServiceError::Forbidden {
                reason: "you are not a member of this organization".into(),
            })?;

        if !caller_membership.role.at_least(OrgRole::OrgAdmin) {
            return Err(ServiceError::Forbidden {
                reason: "requires OrgAdmin role to invite members".into(),
            });
        }

        if let Some(existing) = self
            .invitation_repo
            .find_pending_by_org_and_email(org_id, &email)
            .await?
            && existing.is_valid()
        {
            return Err(ServiceError::Conflict {
                message: "a pending invitation for this email already exists".into(),
            });
        }

        let token = generate_invite_token();
        let expires_at = Utc::now() + Duration::hours(48);

        self.invitation_repo
            .create(NewInvitation {
                id: InvitationId::new(),
                org_id,
                invited_by: caller_id,
                email: email.clone(),
                role,
                token: token.clone(),
                expires_at,
            })
            .await?;

        let org = self
            .org_repo
            .find_by_id(org_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("org not found".into()))?;

        let inviter = self
            .user_repo
            .find_by_id(caller_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("user not found".into()))?;

        let invite_url = self.build_invite_url(&token);

        // Email is best-effort: Resend sandbox (and other provider failures)
        // should not block creating the invite. Admins can copy the link.
        let email_sent = match self
            .email_provider
            .send_invite(InviteEmailData {
                invitee_email: email,
                org_name: org.name,
                inviter_name: inviter.display_name,
                invite_url: invite_url.clone(),
                expires_hours: 48,
            })
            .await
        {
            Ok(()) => true,
            Err(e) => {
                tracing::warn!(
                    error = %e,
                    "invite email failed; invite kept for manual sharing"
                );
                false
            }
        };

        Ok(CreateInviteResult {
            invite_url,
            email_sent,
        })
    }

    /// Lists pending (non-expired) invitations for an org. Caller must be at
    /// least `OrgAdmin` since invitations expose emails of non-members.
    #[tracing::instrument(skip(self), fields(caller_id = %caller_id, org_id = %org_id))]
    pub async fn list_pending_invitations(
        &self,
        caller_id: UserId,
        org_id: OrganizationId,
    ) -> Result<Vec<PendingInvitationView>, ServiceError> {
        self.require_org_admin(caller_id, org_id).await?;

        let invitations = self.invitation_repo.list_pending_by_org(org_id).await?;

        Ok(invitations
            .into_iter()
            .map(|invitation| {
                let invite_url = self.build_invite_url(&invitation.token);
                PendingInvitationView {
                    invitation,
                    invite_url,
                }
            })
            .collect())
    }

    fn build_invite_url(&self, token: &str) -> String {
        format!("{}/accept-invite?token={}", self.app_base_url, token)
    }

    /// Public preview of a pending invite (no auth). Used by the accept-invite
    /// page to lock the email field for new-user signup.
    #[tracing::instrument(skip(self, token))]
    pub async fn preview_invite(&self, token: &str) -> Result<InvitePreview, ServiceError> {
        let invitation = self.invitation_repo.find_by_token(token).await?.ok_or(
            ServiceError::InvitationNotFound {
                id: "invitation".into(),
            },
        )?;

        if !invitation.is_valid() {
            return Err(ServiceError::Conflict {
                message: "this invitation has expired or already been used".into(),
            });
        }

        let org = self
            .org_repo
            .find_by_id(invitation.organization_id)
            .await?
            .ok_or_else(|| ServiceError::Internal("org not found".into()))?;

        Ok(InvitePreview {
            email: invitation.email,
            org_name: org.name,
            role: invitation.role,
            expires_at: invitation.expires_at,
        })
    }

    #[tracing::instrument(skip(self), fields(caller_id = %caller_id, invitation_id = %invitation_id))]
    pub async fn revoke_invitation(
        &self,
        caller_id: UserId,
        org_id: OrganizationId,
        invitation_id: InvitationId,
    ) -> Result<(), ServiceError> {
        self.require_org_admin(caller_id, org_id).await?;

        let invitation = self
            .invitation_repo
            .find_by_id(invitation_id)
            .await?
            .ok_or(ServiceError::InvitationNotFound {
                id: invitation_id.to_string(),
            })?;

        if invitation.organization_id != org_id {
            return Err(ServiceError::InvitationNotFound {
                id: invitation_id.to_string(),
            });
        }

        if invitation.status != InvitationStatus::Pending {
            return Err(ServiceError::Conflict {
                message: "only pending invitations can be revoked".into(),
            });
        }

        self.invitation_repo.revoke(invitation.id).await?;

        Ok(())
    }

    async fn require_org_admin(
        &self,
        caller_id: UserId,
        org_id: OrganizationId,
    ) -> Result<(), ServiceError> {
        let membership = self
            .org_membership_repo
            .find(caller_id, org_id)
            .await?
            .ok_or(ServiceError::Forbidden {
                reason: "you are not a member of this organization".into(),
            })?;

        if !membership.role.at_least(OrgRole::OrgAdmin) {
            return Err(ServiceError::Forbidden {
                reason: "requires OrgAdmin role".into(),
            });
        }

        Ok(())
    }

    pub fn verify_token(&self, token: &str) -> Result<devboard_auth::Claims, ServiceError> {
        self.jwt.verify(token).map_err(ServiceError::from)
    }

    pub async fn get_user(&self, id: UserId) -> Result<PublicUser, ServiceError> {
        self.user_repo
            .find_by_id(id)
            .await?
            .map(PublicUser::from)
            .ok_or_else(|| ServiceError::UserNotFound { id: id.to_string() })
    }

    async fn handle_create_org(
        &self,
        user_id: UserId,
        name: String,
        slug: String,
    ) -> Result<(), ServiceError> {
        validate_org_slug(&slug)?;

        let org_id = OrganizationId::new();

        self.org_repo
            .create(org_id, name, slug)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Conflict {
                        message: "an organization with this slug already exists".into(),
                    }
                }
                other => ServiceError::from(other),
            })?;

        self.org_membership_repo
            .create(user_id, org_id, OrgRole::OrgOwner)
            .await?;

        Ok(())
    }

    async fn handle_accept_invite_for_new_user(
        &self,
        user_id: UserId,
        user_email: &str,
        token: &str,
    ) -> Result<(), ServiceError> {
        let invitation = self.invitation_repo.find_by_token(token).await?.ok_or(
            ServiceError::InvitationNotFound {
                id: "invitation".into(),
            },
        )?;

        if !invitation.is_valid() {
            return Err(ServiceError::Conflict {
                message: "this invitation has expired or has been used".into(),
            });
        }

        if invitation.email.to_lowercase() != user_email.to_lowercase() {
            return Err(ServiceError::Forbidden {
                reason: "this invitation was sent to a different email address".into(),
            });
        }

        self.org_membership_repo
            .create(user_id, invitation.organization_id, invitation.role)
            .await?;

        self.invitation_repo.mark_accepted(invitation.id).await?;

        Ok(())
    }

    async fn build_auth_payload(&self, user: PublicUser) -> Result<AuthPayload, ServiceError> {
        let token = self.jwt.issue(user.id).map_err(ServiceError::from)?;

        let organizations = self
            .org_membership_repo
            .find_all_for_user(user.id)
            .await
            .map_err(ServiceError::from)?;

        Ok(AuthPayload {
            access_token: token,
            user,
            organizations,
        })
    }
}

fn generate_invite_token() -> String {
    use std::fmt::Write;
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes).expect("failed to get random bytes");
    bytes.iter().fold(String::new(), |mut s, b| {
        write!(s, "{:02x}", b).unwrap();
        s
    })
}

// Validation helpers
fn validate_email(email: &str) -> Result<(), ServiceError> {
    if email.is_empty() {
        return Err(ServiceError::Validation {
            field: "email".into(),
            message: "email is required".into(),
        });
    }

    if !email.contains('@') || !email.contains('.') {
        return Err(ServiceError::Validation {
            field: "email".into(),
            message: "email format is invalid".into(),
        });
    }

    Ok(())
}

fn validate_password(password: &str) -> Result<(), ServiceError> {
    if password.len() < 8 {
        return Err(ServiceError::Validation {
            field: "password".into(),
            message: "password must be at least 8 characters".into(),
        });
    }
    Ok(())
}

fn validate_org_slug(slug: &str) -> Result<(), ServiceError> {
    if slug.is_empty() {
        return Err(ServiceError::Validation {
            field: "slug".into(),
            message: "slug is required".into(),
        });
    }
    if !slug
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(ServiceError::Validation {
            field: "slug".into(),
            message: "slug must contain only lowercase letters and hyphens".into(),
        });
    }
    Ok(())
}
