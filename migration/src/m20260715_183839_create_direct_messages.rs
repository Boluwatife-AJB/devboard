use sea_orm_migration::prelude::*;

use crate::m20260621_201057_create_users::User;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // DmThread message
        manager
            .create_table(
                Table::create()
                    .table(DmThread::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(DmThread::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(DmThread::ParticipantA).uuid().not_null())
                    .col(ColumnDef::new(DmThread::ParticipantB).uuid().not_null())
                    .col(
                        ColumnDef::new(DmThread::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_dm_thread_a")
                            .from(DmThread::Table, DmThread::ParticipantA)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_dm_thread_b")
                            .from(DmThread::Table, DmThread::ParticipantB)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_dm_thread_participants_unique")
                    .table(DmThread::Table)
                    .col(DmThread::ParticipantA)
                    .col(DmThread::ParticipantB)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // DM messages table
        manager
            .create_table(
                Table::create()
                    .table(DmMessage::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DmMessage::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(DmMessage::ThreadId).uuid().not_null())
                    .col(ColumnDef::new(DmMessage::AuthorId).uuid().not_null())
                    .col(ColumnDef::new(DmMessage::Body).text().not_null())
                    .col(
                        ColumnDef::new(DmMessage::EditedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(DmMessage::ReadByRecipientAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(DmMessage::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_dm_message_thread")
                            .from(DmMessage::Table, DmMessage::ThreadId)
                            .to(DmThread::Table, DmThread::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_dm_message_author")
                            .from(DmMessage::Table, DmMessage::AuthorId)
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
                    .name("idx_dm_message_thread_created")
                    .table(DmMessage::Table)
                    .col(DmMessage::ThreadId)
                    .col(DmMessage::CreatedAt)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(DmMessage::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(DmThread::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum DmThread {
    Table,
    Id,
    ParticipantA,
    ParticipantB,
    CreatedAt,
}

#[derive(DeriveIden)]
pub enum DmMessage {
    Table,
    Id,
    ThreadId,
    AuthorId,
    Body,
    EditedAt,
    ReadByRecipientAt,
    CreatedAt,
}
