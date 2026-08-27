use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend,
    EntityTrait, QueryFilter, QueryOrder, QuerySelect, Statement,
};
use uuid::Uuid;

use devboard_db::entities::task::{self, Entity as TaskEntity};
use devboard_domain::{ProjectId, Task, TaskId, TaskPriority, TaskStatus, UserId};

use super::{TaskRepository, model_to_domain, priority_to_str, status_to_str};
use crate::{
    error::RepositoryError,
    task::{
        CompletionDayRow, CreateTaskParams, DashboardTaskRow, TeamWorkloadRow,
        dashboard_task_row_from_query,
    },
};

pub struct PgTaskRepository {
    db: DatabaseConnection,
}

impl PgTaskRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

#[async_trait]
impl TaskRepository for PgTaskRepository {
    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn find_by_id(&self, id: TaskId) -> Result<Option<Task>, RepositoryError> {
        let model = TaskEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model.map(model_to_domain).transpose()
    }

    #[tracing::instrument(skip(self), fields(count = ids.len()))]
    async fn find_by_ids(&self, ids: Vec<TaskId>) -> Result<Vec<Task>, RepositoryError> {
        let uuids: Vec<Uuid> = ids.into_iter().map(Uuid::from).collect();

        let models = TaskEntity::find()
            .filter(task::Column::Id.is_in(uuids))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(skip(self), fields(project_id = %project_id))]
    async fn find_by_project(
        &self,
        project_id: ProjectId,
        status: Option<TaskStatus>,
    ) -> Result<Vec<Task>, RepositoryError> {
        let mut query =
            TaskEntity::find().filter(task::Column::ProjectId.eq(Uuid::from(project_id)));

        if let Some(s) = status {
            query = query.filter(task::Column::Status.eq(status_to_str(&s)));
        }

        let models = query
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        models.into_iter().map(model_to_domain).collect()
    }

    #[tracing::instrument(
        skip(self),
        fields(
            task_id = %params.id,
            project_id = %params.project_id,
            reporter_id = %params.reporter_id
        )
    )]
    async fn create(&self, params: CreateTaskParams) -> Result<Task, RepositoryError> {
        let now = Utc::now();

        let active_model = task::ActiveModel {
            id: ActiveValue::Set(Uuid::from(params.id)),
            project_id: ActiveValue::Set(Uuid::from(params.project_id)),
            task_number: ActiveValue::Set(params.task_number),
            title: ActiveValue::Set(params.title),
            description: ActiveValue::Set(params.description),
            status: ActiveValue::Set(status_to_str(&params.status).to_string()),
            priority: ActiveValue::Set(priority_to_str(&params.priority).to_string()),
            reporter_id: ActiveValue::Set(Uuid::from(params.reporter_id)),
            due_date: ActiveValue::Set(params.due_date.map(|d| d.into())),
            assignee_id: ActiveValue::Set(params.assignee_id.map(Uuid::from)),
            created_at: ActiveValue::Set(now.into()),
            updated_at: ActiveValue::Set(now.into()),
            completed_at: ActiveValue::Set(None),
        };

        let model = active_model
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(model)
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn update_status(&self, id: TaskId, status: TaskStatus) -> Result<Task, RepositoryError> {
        let model = TaskEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: task::ActiveModel = model.into();
        active.status = ActiveValue::Set(status_to_str(&status).to_string());
        active.updated_at = ActiveValue::Set(Utc::now().into());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(updated)
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn update_priority(
        &self,
        id: TaskId,
        priority: TaskPriority,
    ) -> Result<Task, RepositoryError> {
        let model = TaskEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: task::ActiveModel = model.into();
        active.priority = ActiveValue::Set(priority_to_str(&priority).to_string());
        active.updated_at = ActiveValue::Set(Utc::now().into());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(updated)
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn assign(
        &self,
        id: TaskId,
        assignee_id: Option<UserId>,
    ) -> Result<Task, RepositoryError> {
        let model = TaskEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: task::ActiveModel = model.into();
        active.assignee_id = ActiveValue::Set(assignee_id.map(Uuid::from));
        active.updated_at = ActiveValue::Set(Utc::now().into());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(updated)
    }

    #[tracing::instrument(skip(self), fields(task_id = %id))]
    async fn delete(&self, id: TaskId) -> Result<(), RepositoryError> {
        let result = TaskEntity::delete_by_id(Uuid::from(id))
            .exec(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        if result.rows_affected == 0 {
            return Err(RepositoryError::NotFound);
        }

        Ok(())
    }

    async fn find_by_project_paginated(
        &self,
        project_id: ProjectId,
        status: Option<TaskStatus>,
        after_id: Option<uuid::Uuid>,
        limit: u64,
    ) -> Result<(Vec<Task>, bool), RepositoryError> {
        let mut query = TaskEntity::find()
            .filter(task::Column::ProjectId.eq(Uuid::from(project_id)))
            .order_by_asc(task::Column::TaskNumber);

        if let Some(s) = status {
            query = query.filter(task::Column::Status.eq(status_to_str(&s)));
        }

        if let Some(after_uuid) = after_id {
            let cursor_task = TaskEntity::find_by_id(after_uuid)
                .one(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?;

            if let Some(ct) = cursor_task {
                query = query.filter(task::Column::TaskNumber.gt(ct.task_number));
            }
        }

        let models = query
            .limit(limit + 1)
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let has_more = models.len() as u64 > limit;
        let models: Vec<_> = models.into_iter().take(limit as usize).collect();

        let task = models
            .into_iter()
            .map(model_to_domain)
            .collect::<Result<Vec<_>, _>>()?;

        Ok((task, has_more))
    }

    async fn update_due_date(
        &self,
        id: TaskId,
        due_date: Option<DateTime<Utc>>,
    ) -> Result<Task, RepositoryError> {
        let model = TaskEntity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;

        let mut active: task::ActiveModel = model.into();
        active.due_date = ActiveValue::Set(due_date.map(|d| d.into()));
        active.updated_at = ActiveValue::Set(Utc::now().into());

        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        model_to_domain(updated)
    }

    async fn list_for_dashboard(
        &self,
        project_ids: &[ProjectId],
    ) -> Result<Vec<DashboardTaskRow>, RepositoryError> {
        if project_ids.is_empty() {
            return Ok(vec![]);
        }

        let ids: Vec<Uuid> = project_ids.iter().copied().map(Uuid::from).collect();

        let sql = r#"
            SELECT
                t.id, t.project_id, t.task_number, t.title, t.description, t.status, t.priority, t.assignee_id, t.reporter_id, t.due_date, t.completed_at, t.created_at, t.updated_at,
                p.key AS project_key,
                p.name AS project_name,
                tm.name AS team_name
            FROM task t
            JOIN project p ON p.id = t.project_id
            JOIN team tm ON tm.id = p.team_id
            WHERE t.project_id = ANY($1)
                AND t.status <> 'CANCELLED'
        "#;

        let rows = self
            .db
            .query_all_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [ids.into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        rows.into_iter()
            .map(|r| dashboard_task_row_from_query(&r))
            .collect()
    }

    async fn completion_by_day(
        &self,
        project_ids: &[ProjectId],
        assignee_id: Option<UserId>,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
    ) -> Result<Vec<CompletionDayRow>, RepositoryError> {
        if project_ids.is_empty() {
            return Ok(vec![]);
        }

        let ids: Vec<Uuid> = project_ids.iter().copied().map(Uuid::from).collect();
        let assignee = assignee_id.map(Uuid::from);

        let sql = r#"
            SELECT (completed_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::bigint AS completed
            FROM task
            WHERE project_id = ANY($1)
                AND completed_at IS NOT NULL
                AND completed_at >= $2
                AND completed_at < $3
                AND ($4::uuid IS NULL OR assignee_id = $4)
            GROUP BY 1
            ORDER BY 1
        "#;

        let rows = self
            .db
            .query_all_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [ids.into(), from.into(), to.into(), assignee.into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        rows.into_iter()
            .map(|row| {
                Ok(CompletionDayRow {
                    day: row
                        .try_get("", "day")
                        .map_err(RepositoryError::from_db_err)?,
                    completed: row
                        .try_get("", "completed")
                        .map_err(RepositoryError::from_db_err)?,
                })
            })
            .collect()
    }

    async fn workload_by_team(
        &self,
        project_ids: &[ProjectId],
    ) -> Result<Vec<TeamWorkloadRow>, RepositoryError> {
        if project_ids.is_empty() {
            return Ok(vec![]);
        }

        let ids: Vec<Uuid> = project_ids.iter().copied().map(Uuid::from).collect();

        let sql = r#"
            SELECT 
                tm.name AS team_name, 
                COUNT(*) FILTER (WHERE t.status IN ('BACKLOG', 'TODO'))::bigint AS todo,
                COUNT(*) FILTER (WHERE t.status IN ('IN_PROGRESS', 'IN_REVIEW'))::bigint AS in_progress,
                COUNT(*) FILTER (WHERE t.status IN ('DONE'))::bigint AS done
            FROM task t
            JOIN project p ON p.id = t.project_id
            JOIN team tm ON tm.id = p.team_id
            WHERE t.project_id = ANY($1)
                AND t.status <> 'CANCELLED'
            GROUP BY tm.name
            ORDER BY tm.name
        "#;

        let rows = self
            .db
            .query_all_raw(Statement::from_sql_and_values(
                DbBackend::Postgres,
                sql,
                [ids.into()],
            ))
            .await
            .map_err(RepositoryError::from_db_err)?;

        rows.into_iter()
            .map(|row| {
                Ok(TeamWorkloadRow {
                    team_name: row
                        .try_get("", "team_name")
                        .map_err(RepositoryError::from_db_err)?,
                    todo: row
                        .try_get("", "todo")
                        .map_err(RepositoryError::from_db_err)?,
                    in_progress: row
                        .try_get("", "in_progress")
                        .map_err(RepositoryError::from_db_err)?,
                    done: row
                        .try_get("", "done")
                        .map_err(RepositoryError::from_db_err)?,
                })
            })
            .collect()
    }
}
