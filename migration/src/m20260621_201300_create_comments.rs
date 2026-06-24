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
                    .table(Comment::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Comment::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Comment::TaskId).uuid().not_null())
                    .col(ColumnDef::new(Comment::AuthorId).uuid().not_null())
                    .col(ColumnDef::new(Comment::Body).text().not_null())
                    .col(
                        ColumnDef::new(Comment::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Comment::EditedAt)
                            .timestamp_with_time_zone()
                            .null()
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_comment_task")
                            .from(Comment::Table, Comment::TaskId)
                            .to(Task::Table, Task::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_comment_author")
                            .from(Comment::Table, Comment::AuthorId)
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
                    .name("idx_comments_task_id")
                    .table(Comment::Table)
                    .col(Comment::TaskId)
                    .to_owned()
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Comment::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Comment {
    Table,
    Id,
    TaskId,
    AuthorId,
    Body,
    CreatedAt,
    EditedAt
}
