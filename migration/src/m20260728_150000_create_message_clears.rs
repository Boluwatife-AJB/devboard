use sea_orm_migration::prelude::*;

use crate::{
    m20260621_201057_create_users::User, m20260715_115330_create_channels::Channel,
    m20260715_183839_create_direct_messages::DmThread,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ChannelMessageClear::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ChannelMessageClear::UserId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(ChannelMessageClear::ChannelId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(ChannelMessageClear::ClearedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .primary_key(
                        Index::create()
                            .col(ChannelMessageClear::UserId)
                            .col(ChannelMessageClear::ChannelId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_channel_message_clear_user")
                            .from(ChannelMessageClear::Table, ChannelMessageClear::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_channel_message_clear_channel")
                            .from(ChannelMessageClear::Table, ChannelMessageClear::ChannelId)
                            .to(Channel::Table, Channel::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(DmMessageClear::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(DmMessageClear::UserId).uuid().not_null())
                    .col(ColumnDef::new(DmMessageClear::ThreadId).uuid().not_null())
                    .col(
                        ColumnDef::new(DmMessageClear::ClearedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .primary_key(
                        Index::create()
                            .col(DmMessageClear::UserId)
                            .col(DmMessageClear::ThreadId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_dm_message_clear_user")
                            .from(DmMessageClear::Table, DmMessageClear::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_dm_message_clear_thread")
                            .from(DmMessageClear::Table, DmMessageClear::ThreadId)
                            .to(DmThread::Table, DmThread::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(DmMessageClear::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(ChannelMessageClear::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum ChannelMessageClear {
    Table,
    UserId,
    ChannelId,
    ClearedAt,
}

#[derive(DeriveIden)]
enum DmMessageClear {
    Table,
    UserId,
    ThreadId,
    ClearedAt,
}
