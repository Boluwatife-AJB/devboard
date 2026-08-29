use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait};
use uuid::Uuid;

use devboard_db::entities::org_membership::{self, Entity as OrgMembershipEntity};
use devboard_domain::{OrgMembership, OrgRole, OrgSummary, OrganizationId, UserId};

use crate::{
    RepositoryError,
    org_membership::{OrgMembershipRepository, org_role_to_str, str_to_org_role},
};

pub struct PgOrgMembershipRepository {
    db: DatabaseConnection,
}

impl PgOrgMembershipRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl OrgMembershipRepository for PgOrgMembershipRepository {
    #[tracing::instrument(skip(self))]
    async fn find(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<Option<OrgMembership>, RepositoryError> {
        let model = OrgMembershipEntity::find_by_id((Uuid::from(org_id), Uuid::from(user_id)))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model
            .map(|m| {
                Ok(OrgMembership {
                    organization_id: OrganizationId::from(m.organization_id),
                    user_id: UserId::from(m.user_id),
                    role: str_to_org_role(&m.role)?,
                    display_name: m.display_name,
                    avatar_url: m.avatar_url,
                    joined_at: m.joined_at.into(),
                })
            })
            .transpose()
    }

    #[tracing::instrument(skip(self))]
    async fn find_all_for_user(&self, user_id: UserId) -> Result<Vec<OrgSummary>, RepositoryError> {
        use sea_orm::{ConnectionTrait, DbBackend, Statement};

        let sql = r#"
        SELECT
            o.id,
            o.name,
            o.slug,
            om.role
        FROM org_membership om
        JOIN organization o ON o.id = om.organization_id
        WHERE om.user_id = $1
        ORDER BY o.name ASC
      "#;

        let rows = self
            .db
            .query_all_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(user_id).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        rows.iter()
            .map(|row| {
                let id: Uuid = row
                    .try_get("", "id")
                    .map_err(RepositoryError::from_db_err)?;
                let name: String = row
                    .try_get("", "name")
                    .map_err(RepositoryError::from_db_err)?;
                let slug: String = row
                    .try_get("", "slug")
                    .map_err(RepositoryError::from_db_err)?;
                let role_str: String = row
                    .try_get("", "role")
                    .map_err(RepositoryError::from_db_err)?;

                Ok(OrgSummary {
                    id: OrganizationId::from(id),
                    name,
                    slug,
                    role: str_to_org_role(&role_str)?,
                })
            })
            .collect()
    }

    #[tracing::instrument(skip(self))]
    async fn list_by_org(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<OrgMembership>, RepositoryError> {
        use sea_orm::{ColumnTrait, QueryFilter};

        let models = OrgMembershipEntity::find()
            .filter(org_membership::Column::OrganizationId.eq(Uuid::from(org_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models
            .into_iter()
            .map(|m| {
                Ok(OrgMembership {
                    organization_id: OrganizationId::from(m.organization_id),
                    user_id: UserId::from(m.user_id),
                    role: str_to_org_role(&m.role)?,
                    display_name: m.display_name,
                    avatar_url: m.avatar_url,
                    joined_at: m.joined_at.into(),
                })
            })
            .collect()
    }

    #[tracing::instrument(skip(self))]
    async fn create(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        role: OrgRole,
        display_name: String,
    ) -> Result<OrgMembership, RepositoryError> {
        let now = Utc::now();
        let active = org_membership::ActiveModel {
            organization_id: ActiveValue::Set(Uuid::from(org_id)),
            user_id: ActiveValue::Set(Uuid::from(user_id)),
            role: ActiveValue::Set(org_role_to_str(&role).to_string()),
            display_name: ActiveValue::Set(display_name.clone()),
            avatar_url: ActiveValue::Set(None),
            joined_at: ActiveValue::Set(now.into()),
        };

        active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(OrgMembership {
            organization_id: org_id,
            user_id,
            role,
            display_name,
            avatar_url: None,
            joined_at: now,
        })
    }

    async fn update_profile(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        display_name: String,
        avatar_url: Option<String>,
    ) -> Result<OrgMembership, RepositoryError> {
        let model = OrgMembershipEntity::find_by_id((Uuid::from(org_id), Uuid::from(user_id)))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: org_membership::ActiveModel = model.into();
        active.display_name = ActiveValue::Set(display_name);
        active.avatar_url = ActiveValue::Set(avatar_url.clone());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(OrgMembership {
            organization_id: org_id,
            user_id,
            role: str_to_org_role(&updated.role)?,
            display_name: updated.display_name,
            avatar_url: updated.avatar_url,
            joined_at: updated.joined_at.into(),
        })
    }

    #[tracing::instrument(skip(self))]
    async fn update_role(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        role: OrgRole,
    ) -> Result<OrgMembership, RepositoryError> {
        let model = OrgMembershipEntity::find_by_id((Uuid::from(org_id), Uuid::from(user_id)))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: org_membership::ActiveModel = model.into();
        active.role = ActiveValue::Set(org_role_to_str(&role).to_string());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        Ok(OrgMembership {
            organization_id: org_id,
            user_id,
            role,
            display_name: updated.display_name,
            avatar_url: updated.avatar_url,
            joined_at: updated.joined_at.into(),
        })
    }

    async fn delete(&self, user_id: UserId, org_id: OrganizationId) -> Result<(), RepositoryError> {
        let result = OrgMembershipEntity::delete_by_id((Uuid::from(org_id), Uuid::from(user_id)))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }
        Ok(())
    }
}
