use sea_orm_migration::prelude::*;

use crate::{m20260621_201057_create_users::User, m20260621_201248_create_tasks::Task};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(TaskAttachment::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TaskAttachment::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(TaskAttachment::TaskId).uuid().not_null())
                    .col(ColumnDef::new(TaskAttachment::AddedBy).uuid().not_null())
                    .col(ColumnDef::new(TaskAttachment::Kind).string().not_null())
                    .col(ColumnDef::new(TaskAttachment::Label).string().not_null())
                    .col(ColumnDef::new(TaskAttachment::Url).string().not_null())
                    .col(
                        ColumnDef::new(TaskAttachment::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_attachement_task")
                            .from(TaskAttachment::Table, TaskAttachment::TaskId)
                            .to(Task::Table, Task::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_attachement_user")
                            .from(TaskAttachment::Table, TaskAttachment::AddedBy)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_task_attachment_task_id")
                    .table(TaskAttachment::Table)
                    .col(TaskAttachment::TaskId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TaskAttachment::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum TaskAttachment {
    Table,
    Id,
    TaskId,
    AddedBy,
    Kind,
    Label,
    Url,
    CreatedAt,
}
