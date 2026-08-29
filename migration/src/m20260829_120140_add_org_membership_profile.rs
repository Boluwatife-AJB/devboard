use sea_orm_migration::prelude::*;

use crate::m20260701_190344_create_organization_memberships::OrgMembership;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrgMembership::Table)
                    .add_column(
                        ColumnDef::new(Alias::new("display_name"))
                            .string()
                            .not_null()
                            .default(""),
                    )
                    .add_column(ColumnDef::new(Alias::new("avatar_url")).string().null())
                    .to_owned(),
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                UPDATE org_membership om
                SET display_name = u.display_name
                FROM "user" u
                WHERE om.user_id = u.id
                    AND om.display_name = ''
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(OrgMembership::Table)
                    .drop_column(Alias::new("avatar_url"))
                    .drop_column(Alias::new("display_name"))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}
