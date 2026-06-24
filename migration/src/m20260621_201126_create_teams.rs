use sea_orm_migration::prelude::*;

use crate::m20260621_141230_create_organizations::Organization;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Team::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Team::Id).uuid().not_null().primary_key())
                    .col(
                        ColumnDef::new(Team::OrganizationId)
                            .uuid()
                            .not_null()
                    )
                    .col(ColumnDef::new(Team::Name).string().not_null())
                    .col(
                        ColumnDef::new(Team::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Team::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_team_organization")
                            .from(Team::Table, Team::OrganizationId)
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
                    .name("idx_teams_organization_id")
                    .table(Team::Table)
                    .col(Team::OrganizationId)
                    .to_owned(),
            )
            .await


    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Team::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Team {
    Table,
    Id,
    OrganizationId,
    Name,
    CreatedAt,
    UpdatedAt
}
