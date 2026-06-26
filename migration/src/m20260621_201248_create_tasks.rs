use sea_orm_migration::prelude::*;

use crate::{m20260621_201057_create_users::User, m20260621_201203_create_projects::Project};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Task::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Task::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Task::ProjectId).uuid().not_null())
                    .col(ColumnDef::new(Task::TaskNumber).integer().not_null())
                    .col(ColumnDef::new(Task::Title).string().not_null())
                    .col(ColumnDef::new(Task::Description).text().null())
                    .col(
                        ColumnDef::new(Task::Status)
                        .string()
                        .not_null()
                        .default("BACKLOG"),
                    )
                    .col(
                        ColumnDef::new(Task::Priority)
                        .string()
                        .not_null()
                        .default("MEDIUM"),
                    )
                    .col(ColumnDef::new(Task::AssigneeId).uuid().null())
                    .col(ColumnDef::new(Task::ReporterId).uuid().not_null())
                    .col(
                        ColumnDef::new(Task::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Task::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_task_project")
                            .from(Task::Table, Task::ProjectId)
                            .to(Project::Table, Project::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_task_assignee")
                            .from(Task::Table, Task::AssigneeId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_task_reporter")
                            .from(Task::Table, Task::ReporterId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Restrict)
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_tasks_project_number_unique")
                    .table(Task::Table)
                    .col(Task::ProjectId)
                    .col(Task::TaskNumber)
                    .unique()
                    .to_owned(),    
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_task_assignee_id")
                    .table(Task::Table)
                    .col(Task::AssigneeId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_tasks_status")
                    .table(Task::Table)
                    .col(Task::Status)
                    .to_owned()
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Task::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
#[allow(clippy::enum_variant_names)]
pub enum Task {
    Table,
    Id,
    ProjectId,
    Title,
    TaskNumber,
    Description,
    Status,
    Priority,
    AssigneeId,
    ReporterId,
    CreatedAt,
    UpdatedAt,
}
