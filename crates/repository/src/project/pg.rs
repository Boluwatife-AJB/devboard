use async_trait::async_trait;
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend,
    EntityTrait, QueryFilter, Statement,
};
use uuid::Uuid;

use devboard_db::entities::{
    project::{self, Entity as ProjectEntity},
    project_membership,
};
use devboard_domain::{
    OrganizationId, Project, ProjectId, ProjectMembership, ProjectRole, TeamId, UserId,
};

use super::{ProjectRepository, membership_to_domain, model_to_domain, project_role_to_str};
use crate::error::RepositoryError;

pub struct PgProjectRepository {
    db: DatabaseConnection,
}

impl PgProjectRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl ProjectRepository for PgProjectRepository {
    #[tracing::instrument(skip(self), fields(project_id = %id))]
    async fn find_by_id(&self, id: ProjectId) -> Result<Option<Project>, RepositoryError> {
        let model = ProjectEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self))]
    async fn find_by_ids(&self, ids: Vec<ProjectId>) -> Result<Vec<Project>, RepositoryError> {
        let uuids: Vec<Uuid> = ids.into_iter().map(Uuid::from).collect();

        let models = ProjectEntity::find()
            .filter(project::Column::Id.is_in(uuids))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(skip(self), fields(org_id = %org_id))]
    async fn find_by_organization(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<Project>, RepositoryError> {
        let models = ProjectEntity::find()
            .filter(project::Column::OrganizationId.eq(Uuid::from(org_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(skip(self), fields(project_id = %id))]
    async fn create(
        &self,
        id: ProjectId,
        organization_id: OrganizationId,
        team_id: TeamId,
        name: String,
        key: String,
        description: Option<String>,
    ) -> Result<Project, RepositoryError> {
        let now = Utc::now();

        let active_model = project::ActiveModel {
            id: ActiveValue::Set(Uuid::from(id)),
            organization_id: ActiveValue::Set(Uuid::from(organization_id)),
            team_id: ActiveValue::Set(Uuid::from(team_id)),
            name: ActiveValue::Set(name),
            key: ActiveValue::Set(key),
            description: ActiveValue::Set(description),
            next_task_number: ActiveValue::Set(0),
            created_at: ActiveValue::Set(now.into()),
            updated_at: ActiveValue::Set(now.into()),
        };

        let model = active_model
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    #[tracing::instrument(skip(self), fields(project_id = %project_id))]
    async fn next_task_number(&self, project_id: ProjectId) -> Result<i32, RepositoryError> {
        let sql = r#"
          UPDATE project
          SET next_task_number = next_task_number + 1
          WHERE id = $1
          RETURNING next_task_number
      "#;

        let result = self
            .db
            .query_one_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [Uuid::from(project_id).into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let task_number: i32 = result
            .try_get("", "next_task_number")
            .map_err(RepositoryError::from_db_err)?;

        Ok(task_number)
    }

    #[tracing::instrument(
        skip(self),
        fields(project_id = %project_id, user_id = %user_id)
    )]
    async fn add_member(
        &self,
        project_id: ProjectId,
        user_id: UserId,
        role_override: Option<ProjectRole>,
    ) -> Result<ProjectMembership, RepositoryError> {
        let now = Utc::now();

        let active_model = project_membership::ActiveModel {
            project_id: ActiveValue::Set(Uuid::from(project_id)),
            user_id: ActiveValue::Set(Uuid::from(user_id)),
            role_override: ActiveValue::Set(
                role_override
                    .as_ref()
                    .map(project_role_to_str)
                    .map(str::to_string),
            ),
            added_at: ActiveValue::Set(now.into()),
        };

        let model = active_model
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        membership_to_domain(model)
    }

    #[tracing::instrument(
        skip(self),
        fields(project_id = %project_id, user_id = %user_id)
    )]
    async fn get_membership(
        &self,
        project_id: ProjectId,
        user_id: UserId,
    ) -> Result<Option<ProjectMembership>, RepositoryError> {
        use devboard_db::entities::project_membership::Entity as PmEntity;

        let model = PmEntity::find_by_id((Uuid::from(project_id), Uuid::from(user_id)))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(membership_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(project_id = %id))]
    async fn delete(&self, id: ProjectId) -> Result<(), RepositoryError> {
        let result = ProjectEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }

        Ok(())
    }
}
