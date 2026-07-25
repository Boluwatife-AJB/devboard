pub mod pg;

use async_trait::async_trait;
use chrono::{DateTime, Utc};

use devboard_domain::{
    Invitation, InvitationId, InvitationStatus, OrgRole, OrganizationId, UserId,
};

use crate::{RepositoryError, org_membership::str_to_org_role};

#[derive(Clone, Debug)]
pub struct NewInvitation {
    pub id: InvitationId,
    pub org_id: OrganizationId,
    pub invited_by: UserId,
    pub email: String,
    pub role: OrgRole,
    pub token: String,
    pub expires_at: DateTime<Utc>,
}

#[async_trait]
pub trait InvitationRepository: Send + Sync {
    async fn find_by_token(&self, token: &str) -> Result<Option<Invitation>, RepositoryError>;

    async fn find_by_id(&self, id: InvitationId) -> Result<Option<Invitation>, RepositoryError>;

    async fn find_pending_by_org_and_email(
        &self,
        org_id: OrganizationId,
        email: &str,
    ) -> Result<Option<Invitation>, RepositoryError>;

    async fn list_pending_by_org(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<Invitation>, RepositoryError>;

    async fn create(&self, invitation: NewInvitation) -> Result<Invitation, RepositoryError>;

    async fn mark_accepted(&self, id: InvitationId) -> Result<(), RepositoryError>;

    async fn revoke(&self, id: InvitationId) -> Result<(), RepositoryError>;
}

pub(crate) fn invitation_status_to_str(status: InvitationStatus) -> &'static str {
    match status {
        InvitationStatus::Pending => "PENDING",
        InvitationStatus::Accepted => "ACCEPTED",
        InvitationStatus::Expired => "EXPIRED",
        InvitationStatus::Revoked => "REVOKED",
    }
}

pub(crate) fn str_to_invitation_status(s: &str) -> Result<InvitationStatus, RepositoryError> {
    match s {
        "PENDING" => Ok(InvitationStatus::Pending),
        "ACCEPTED" => Ok(InvitationStatus::Accepted),
        "EXPIRED" => Ok(InvitationStatus::Expired),
        "REVOKED" => Ok(InvitationStatus::Revoked),
        other => Err(RepositoryError::InvalidData {
            message: format!("unknown invitation status: {other:?}"),
        }),
    }
}

pub(crate) fn model_to_domain(
    model: devboard_db::entities::invitation::Model,
) -> Result<Invitation, RepositoryError> {
    Ok(Invitation {
        id: InvitationId::from(model.id),
        organization_id: OrganizationId::from(model.organization_id),
        invited_by: UserId::from(model.invited_by),
        email: model.email,
        role: str_to_org_role(&model.role)?,
        token: model.token,
        status: str_to_invitation_status(&model.status)?,
        expires_at: model.expires_at.into(),
        created_at: model.created_at.into(),
        accepted_at: model.accepted_at.map(Into::into),
    })
}
