use sea_orm_migration::prelude::*;

use crate::{m20260621_201057_create_users::User, m20260715_115330_create_channels::Channel};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Message::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Message::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Message::ChannelId).uuid().not_null())
                    .col(ColumnDef::new(Message::AuthorId).uuid().not_null())
                    .col(ColumnDef::new(Message::Body).text().not_null())
                    .col(ColumnDef::new(Message::Embeds).json_binary().null())
                    .col(
                        ColumnDef::new(Message::EditedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(Message::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_message_channel")
                            .from(Message::Table, Message::ChannelId)
                            .to(Channel::Table, Channel::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_message_author")
                            .from(Message::Table, Message::AuthorId)
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
                    .name("idx_message_channel_created")
                    .table(Message::Table)
                    .col(Message::ChannelId)
                    .col(Message::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Message::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Message {
    Table,
    Id,
    ChannelId,
    AuthorId,
    Body,
    Embeds,
    EditedAt,
    CreatedAt,
}
