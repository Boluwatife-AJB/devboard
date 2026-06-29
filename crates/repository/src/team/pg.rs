use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
};
use uuid::Uuid;

use devboard_db::entities::{
    team::{self, Entity as TeamEntity},
    team_membership,
};
use devboard_domain::{OrganizationId, Team, TeamId, TeamMembership, TeamRole, UserId};

use super::{TeamRepository, membership_to_domain, model_to_domain, team_role_to_str};
use crate::RepositoryError;

pub struct PgTeamRepository {
    db: DatabaseConnection,
}

impl PgTeamRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl TeamRepository for PgTeamRepository {
    #[tracing::instrument(skip(self), fields(team_id = %id))]
    async fn find_by_id(&self, id: TeamId) -> Result<Option<Team>, RepositoryError> {
        let model = TeamEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(org_id = %org_id))]
    async fn find_by_organization(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<Team>, RepositoryError> {
        let models = TeamEntity::find()
            .filter(team::Column::OrganizationId.eq(Uuid::from(org_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models
            .into_iter()
            .map(model_to_domain)
            .collect::<Result<Vec<_>, _>>()
    }

    #[tracing::instrument(skip(self), fields(team_id = %id, organisation_id = %organization_id))]
    async fn create(
        &self,
        id: TeamId,
        organization_id: OrganizationId,
        name: String,
    ) -> Result<Team, RepositoryError> {
        let now = Utc::now();

        let active = team::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            organization_id: ActiveValue::Set(Uuid::from(organization_id)),
            name: ActiveValue::Set(name),
            created_at: ActiveValue::Set(now.into()),
            updated_at: ActiveValue::Set(now.into()),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    async fn add_member(
        &self,
        team_id: TeamId,
        user_id: UserId,
        role: TeamRole,
    ) -> Result<TeamMembership, RepositoryError> {
        let now = Utc::now();

        let active = team_membership::ActiveModel {
            team_id: ActiveValue::Set(Uuid::from(team_id)),
            user_id: ActiveValue::Set(Uuid::from(user_id)),
            role: ActiveValue::Set(team_role_to_str(&role).to_string()),
            joined_at: ActiveValue::Set(now.into()),
        };

        let model = active
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        membership_to_domain(model)
    }

    async fn get_membership(
        &self,
        team_id: TeamId,
        user_id: UserId,
    ) -> Result<Option<TeamMembership>, RepositoryError> {
        use devboard_db::entities::team_membership::Entity as TmEntity;

        let model = TmEntity::find_by_id((Uuid::from(team_id), Uuid::from(user_id)))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(membership_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(team_id = %id))]
    async fn delete(&self, id: TeamId) -> Result<(), RepositoryError> {
        let result = TeamEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }

        Ok(())
    }
}
