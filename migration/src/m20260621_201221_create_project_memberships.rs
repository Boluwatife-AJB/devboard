use sea_orm_migration::prelude::*;

use crate::{m20260621_201057_create_users::User, m20260621_201203_create_projects::Project};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ProjectMembership::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ProjectMembership::ProjectId)
                            .uuid()
                            .not_null()
                    )
                    .col(ColumnDef::new(ProjectMembership::UserId).uuid().not_null())
                    .col(
                        ColumnDef::new(ProjectMembership::RoleOverride)
                            .string()
                            .null()
                    )
                    .col(
                        ColumnDef::new(ProjectMembership::AddedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp())
                    )
                    .primary_key(
                        Index::create()
                            .col(ProjectMembership::ProjectId)
                            .col(ProjectMembership::UserId)
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_proj_membership_project")
                            .from(ProjectMembership::Table, ProjectMembership::ProjectId)
                            .to(Project::Table, Project::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_proj_membership_user")
                            .from(ProjectMembership::Table, ProjectMembership::UserId)
                            .to(User::Table, User::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_project_membership_user_id")
                    .table(ProjectMembership::Table)
                    .col(ProjectMembership::UserId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ProjectMembership::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum ProjectMembership {
    Table,
    ProjectId,
    UserId,
    RoleOverride,
    AddedAt
}
