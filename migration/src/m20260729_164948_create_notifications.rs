use sea_orm_migration::prelude::*;

use crate::{
    m20260621_141230_create_organizations::Organization, m20260621_201057_create_users::User,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Notification::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Notification::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Notification::RecipientId).uuid().not_null())
                    .col(
                        ColumnDef::new(Notification::OrganizationId)
                            .uuid()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Notification::Kind).string().not_null())
                    .col(ColumnDef::new(Notification::Title).string().not_null())
                    .col(ColumnDef::new(Notification::Body).text().null())
                    .col(ColumnDef::new(Notification::ActionUrl).string().null())
                    .col(ColumnDef::new(Notification::Metadata).json().null())
                    .col(
                        ColumnDef::new(Notification::ReadAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(Notification::EmailSentAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(Notification::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_notification_recipient")
                            .from(Notification::Table, Notification::RecipientId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_notification_org")
                            .from(Notification::Table, Notification::OrganizationId)
                            .to(Organization::Table, Organization::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_notification_recipient_read")
                    .table(Notification::Table)
                    .col(Notification::RecipientId)
                    .col(Notification::ReadAt)
                    .col(Notification::CreatedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_notification_email_sent")
                    .table(Notification::Table)
                    .col(Notification::RecipientId)
                    .col(Notification::EmailSentAt)
                    .col(Notification::CreatedAt)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Notification::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Notification {
    Table,
    Id,
    RecipientId,
    OrganizationId,
    Kind,
    Title,
    Body,
    ActionUrl,
    Metadata,
    ReadAt,
    EmailSentAt,
    CreatedAt,
}
