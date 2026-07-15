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
                    .table(Channel::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Channel::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Channel::OrganisationId).uuid().not_null())
                    .col(ColumnDef::new(Channel::CreatedBy).uuid().not_null())
                    .col(ColumnDef::new(Channel::Slug).string().not_null())
                    .col(ColumnDef::new(Channel::Name).string().not_null())
                    .col(ColumnDef::new(Channel::Description).text().null())
                    .col(
                        ColumnDef::new(Channel::Kind)
                            .string()
                            .not_null()
                            .default("OPEN"),
                    )
                    .col(
                        ColumnDef::new(Channel::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Channel::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_channel_org")
                            .from(Channel::Table, Channel::OrganisationId)
                            .to(Organization::Table, Organization::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_channel_creator")
                            .from(Channel::Table, Channel::CreatedBy)
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
                    .name("idx_channel_org_slug_unique")
                    .table(Channel::Table)
                    .col(Channel::OrganisationId)
                    .col(Channel::Slug)
                    .unique()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_channel_org_id")
                    .table(Channel::Table)
                    .col(Channel::OrganisationId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Channel::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Channel {
    Table,
    Id,
    OrganisationId,
    CreatedBy,
    Slug,
    Name,
    Description,
    Kind,
    CreatedAt,
    UpdatedAt,
}
