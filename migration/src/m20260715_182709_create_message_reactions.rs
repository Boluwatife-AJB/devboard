use sea_orm_migration::prelude::*;

use crate::{m20260621_201057_create_users::User, m20260715_180458_create_messages::Message};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(MessageReaction::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(MessageReaction::MessageId).uuid().not_null())
                    .col(ColumnDef::new(MessageReaction::UserId).uuid().not_null())
                    .col(ColumnDef::new(MessageReaction::Emoji).string().not_null())
                    .col(
                        ColumnDef::new(MessageReaction::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .primary_key(
                        Index::create()
                            .col(MessageReaction::MessageId)
                            .col(MessageReaction::UserId)
                            .col(MessageReaction::Emoji),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_reaction_message")
                            .from(MessageReaction::Table, MessageReaction::MessageId)
                            .to(Message::Table, Message::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_reaction_user")
                            .from(MessageReaction::Table, MessageReaction::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_reaction_message_id")
                    .table(MessageReaction::Table)
                    .col(MessageReaction::MessageId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(MessageReaction::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum MessageReaction {
    Table,
    MessageId,
    UserId,
    Emoji,
    CreatedAt,
}
