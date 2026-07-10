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
                    .table(OrgMembership::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrgMembership::OrganizationId)
                            .uuid()
                            .not_null(),
                    )
                    .col(ColumnDef::new(OrgMembership::UserId).uuid().not_null())
                    .col(ColumnDef::new(OrgMembership::Role).string().not_null())
                    .col(
                        ColumnDef::new(OrgMembership::JoinedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .primary_key(
                        Index::create()
                            .col(OrgMembership::OrganizationId)
                            .col(OrgMembership::UserId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_org_membership_org")
                            .from(OrgMembership::Table, OrgMembership::OrganizationId)
                            .to(Organization::Table, Organization::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_org_membership_user")
                            .from(OrgMembership::Table, OrgMembership::UserId)
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
                    .name("idx_org_membership_user_id")
                    .table(OrgMembership::Table)
                    .col(OrgMembership::UserId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(OrgMembership::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum OrgMembership {
    Table,
    OrganizationId,
    UserId,
    Role,
    JoinedAt,
}
