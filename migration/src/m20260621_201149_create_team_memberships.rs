use sea_orm_migration::prelude::*;

use crate::m20260621_201126_create_teams::Team;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(TeamMembership::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(TeamMembership::TeamId).uuid().not_null())
                    .col(ColumnDef::new(TeamMembership::UserId).uuid().not_null())
                    .col(ColumnDef::new(TeamMembership::Role).string().not_null())
                    .col(
                        ColumnDef::new(TeamMembership::JoinedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .primary_key(
                        Index::create()
                            .col(TeamMembership::TeamId)
                            .col(TeamMembership::UserId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_membership_team")
                            .from(TeamMembership::Table, TeamMembership::TeamId)
                            .to(Team::Table, Team::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_team_memberships_user_id")
                    .table(TeamMembership::Table)
                    .col(TeamMembership::UserId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TeamMembership::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum TeamMembership {
    Table,
    TeamId,
    UserId,
    Role,
    JoinedAt,
}
