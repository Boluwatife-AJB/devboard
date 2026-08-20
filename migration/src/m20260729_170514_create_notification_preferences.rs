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
                    .table(NotificationPreference::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(NotificationPreference::UserId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(NotificationPreference::OrganizationId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(NotificationPreference::Kind)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(NotificationPreference::InApp)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(NotificationPreference::Email)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(NotificationPreference::Push)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .primary_key(
                        Index::create()
                            .col(NotificationPreference::UserId)
                            .col(NotificationPreference::OrganizationId)
                            .col(NotificationPreference::Kind),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_notif_pref_user")
                            .from(
                                NotificationPreference::Table,
                                NotificationPreference::UserId,
                            )
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_notif_pref_org")
                            .from(
                                NotificationPreference::Table,
                                NotificationPreference::OrganizationId,
                            )
                            .to(Organization::Table, Organization::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table(NotificationPreference::Table)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
pub enum NotificationPreference {
    Table,
    UserId,
    OrganizationId,
    Kind,
    InApp,
    Email,
    Push,
}
