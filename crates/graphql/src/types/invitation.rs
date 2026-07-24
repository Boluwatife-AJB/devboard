use async_graphql::{Enum, ID, Object};
use chrono::{DateTime, Utc};
use devboard_domain::{Invitation, InvitationStatus};

use crate::types::team::GqlOrgRole;

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlInvitationStatus {
    Pending,
    Accepted,
    Expired,
    Revoked,
}

impl From<InvitationStatus> for GqlInvitationStatus {
    fn from(status: InvitationStatus) -> Self {
        match status {
            InvitationStatus::Pending => Self::Pending,
            InvitationStatus::Accepted => Self::Accepted,
            InvitationStatus::Expired => Self::Expired,
            InvitationStatus::Revoked => Self::Revoked,
        }
    }
}

/// An organization invitation visible to OrgAdmin+.
///
/// Exposes `invite_url` (not the raw token alone) so admins can copy and share
/// the link when email delivery is unavailable. Only returned from
/// admin-gated queries.
#[derive(Clone)]
pub struct GqlInvitation {
    pub inner: Invitation,
    pub invite_url: String,
}

#[Object]
impl GqlInvitation {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }

    async fn email(&self) -> &str {
        &self.inner.email
    }

    async fn role(&self) -> GqlOrgRole {
        GqlOrgRole::from(self.inner.role)
    }

    async fn status(&self) -> GqlInvitationStatus {
        GqlInvitationStatus::from(self.inner.status)
    }

    async fn invited_by(&self) -> ID {
        ID(self.inner.invited_by.to_string())
    }

    async fn invite_url(&self) -> &str {
        &self.invite_url
    }

    async fn expires_at(&self) -> DateTime<Utc> {
        self.inner.expires_at
    }

    async fn created_at(&self) -> DateTime<Utc> {
        self.inner.created_at
    }
}
