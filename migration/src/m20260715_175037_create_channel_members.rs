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
                    .table(ChannelMember::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(ChannelMember::ChannelId).uuid().not_null())
                    .col(ColumnDef::new(ChannelMember::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(ChannelMember::JoinedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(ChannelMember::LastReadMessageId)
                            .uuid()
                            .null(),
                    )
                    .primary_key(
                        Index::create()
                            .col(ChannelMember::ChannelId)
                            .col(ChannelMember::UserId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_channel_member_channel")
                            .from(ChannelMember::Table, ChannelMember::ChannelId)
                            .to(Channel::Table, Channel::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_channel_member_user")
                            .from(ChannelMember::Table, ChannelMember::UserId)
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
                    .name("idx_channel_member_user_id")
                    .table(ChannelMember::Table)
                    .col(ChannelMember::UserId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ChannelMember::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum ChannelMember {
    Table,
    ChannelId,
    UserId,
    JoinedAt,
    LastReadMessageId,
}
