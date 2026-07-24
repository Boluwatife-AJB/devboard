use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
    QueryOrder,
};
use uuid::Uuid;

use devboard_domain::{Invitation, InvitationId, InvitationStatus, OrganizationId};

use devboard_db::entities::invitation::{self, Entity as InvitationEntity};

use crate::{
    NewInvitation, RepositoryError,
    invitation::{InvitationRepository, invitation_status_to_str, model_to_domain},
    org_membership::org_role_to_str,
};

pub struct PgInvitationRepository {
    db: DatabaseConnection,
}

impl PgInvitationRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl InvitationRepository for PgInvitationRepository {
    #[tracing::instrument(skip(self))]
    async fn find_by_token(&self, token: &str) -> Result<Option<Invitation>, RepositoryError> {
        let model = InvitationEntity::find()
            .filter(invitation::Column::Token.eq(token))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(invitation_id = %id))]
    async fn find_by_id(&self, id: InvitationId) -> Result<Option<Invitation>, RepositoryError> {
        let model = InvitationEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(org_id = %org_id, email = %email))]
    async fn find_pending_by_org_and_email(
        &self,
        org_id: OrganizationId,
        email: &str,
    ) -> Result<Option<Invitation>, RepositoryError> {
        let model = InvitationEntity::find()
            .filter(invitation::Column::OrganizationId.eq(Uuid::from(org_id)))
            .filter(invitation::Column::Email.eq(email))
            .filter(
                invitation::Column::Status.eq(invitation_status_to_str(InvitationStatus::Pending)),
            )
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(org_id = %org_id))]
    async fn list_pending_by_org(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<Invitation>, RepositoryError> {
        let models = InvitationEntity::find()
            .filter(invitation::Column::OrganizationId.eq(Uuid::from(org_id)))
            .filter(
                invitation::Column::Status.eq(invitation_status_to_str(InvitationStatus::Pending)),
            )
            .filter(invitation::Column::ExpiresAt.gt(Utc::now()))
            .order_by_desc(invitation::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(skip(self), fields(invitation_id = %invitation.id, org_id = %invitation.org_id))]
    async fn create(&self, invitation: NewInvitation) -> Result<Invitation, RepositoryError> {
        let now = Utc::now();

        let active = invitation::ActiveModel {
            id: ActiveValue::Set(Uuid::from(invitation.id)),
            organization_id: ActiveValue::Set(Uuid::from(invitation.org_id)),
            email: ActiveValue::Set(invitation.email.to_string()),
            role: ActiveValue::Set(org_role_to_str(&invitation.role).to_string()),
            status: ActiveValue::Set(
                invitation_status_to_str(InvitationStatus::Pending).to_string(),
            ),
            expires_at: ActiveValue::Set(invitation.expires_at.into()),
            token: ActiveValue::Set(invitation.token),
            created_at: ActiveValue::Set(now.into()),
            accepted_at: ActiveValue::Set(None),
            invited_by: ActiveValue::Set(Uuid::from(invitation.invited_by)),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    #[tracing::instrument(skip(self), fields(invitation_id = %id))]
    async fn mark_accepted(&self, id: InvitationId) -> Result<(), RepositoryError> {
        let model = InvitationEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: invitation::ActiveModel = model.into();
        active.status =
            ActiveValue::Set(invitation_status_to_str(InvitationStatus::Accepted).to_string());
        active.accepted_at = ActiveValue::Set(Some(Utc::now().into()));

        active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }

    #[tracing::instrument(skip(self), fields(invitation_id = %id))]
    async fn revoke(&self, id: InvitationId) -> Result<(), RepositoryError> {
        let model = InvitationEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: invitation::ActiveModel = model.into();
        active.status =
            ActiveValue::Set(invitation_status_to_str(InvitationStatus::Revoked).to_string());

        active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(())
    }
}
