use sea_orm_migration::prelude::*;

use crate::m20260621_201057_create_users::User;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(PushSubscription::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(PushSubscription::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(PushSubscription::UserId).uuid().not_null())
                    .col(ColumnDef::new(PushSubscription::Endpoint).text().not_null())
                    .col(ColumnDef::new(PushSubscription::Auth).text().not_null())
                    .col(ColumnDef::new(PushSubscription::P256dh).text().not_null())
                    .col(
                        ColumnDef::new(PushSubscription::UserAgent)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PushSubscription::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(PushSubscription::LastUsedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_push_sub_user")
                            .from(PushSubscription::Table, PushSubscription::UserId)
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
                    .name("idx_push_sub_user_id")
                    .table(PushSubscription::Table)
                    .col(PushSubscription::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_push_sub_endpoint_unique")
                    .table(PushSubscription::Table)
                    .col(PushSubscription::UserId)
                    .col(PushSubscription::Endpoint)
                    .unique()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PushSubscription::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum PushSubscription {
    Table,
    Id,
    UserId,
    Endpoint,
    Auth,
    P256dh,
    UserAgent,
    CreatedAt,
    LastUsedAt,
}
