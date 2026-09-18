use sea_orm_migration::prelude::*;

use crate::{
    m20260621_141230_create_organizations::Organization,
    m20260715_183839_create_direct_messages::DmThread,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(DmThread::Table)
                    .add_column(ColumnDef::new(Alias::new("organization_id")).uuid().null())
                    .to_owned(),
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                UPDATE dm_thread dt
                SET organization_id = sub.org_id
                FROM (
                    SELECT DISTINCT ON (dt.id)
                        dt.id AS thread_id,
                        om_a.organization_id AS org_id
                    FROM dm_thread dt
                    JOIN org_membership om_a ON om_a.user_id = dt.participant_a
                    JOIN org_membership om_b
                        ON om_b.organization_id = om_a.organization_id
                        AND om_b.user_id = dt.participant_b
                    ORDER BY dt.id, om_a.organization_id
                ) sub
                WHERE dt.id = sub.thread_id
                    AND dt.organization_id IS NULL
                "#,
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                UPDATE dm_thread dt
                SET organization_id = (
                    SELECT om.organization_id
                    FROM org_membership om
                    WHERE om.user_id = dt.participant_a
                    ORDER BY om.joined_at ASC
                    LIMIT 1
                )
                WHERE dt.organization_id IS NULL
                "#,
            )
            .await?;

        manager
            .drop_index(
                Index::drop()
                    .name("idx_dm_thread_participants_unique")
                    .table(DmThread::Table)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DmThread::Table)
                    .modify_column(
                        ColumnDef::new(Alias::new("organization_id"))
                            .uuid()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_dm_thread_organization")
                    .from(DmThread::Table, Alias::new("organization_id"))
                    .to(Organization::Table, Organization::Id)
                    .on_delete(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_dm_thread_org_participants_unique")
                    .table(DmThread::Table)
                    .col(Alias::new("organization_id"))
                    .col(DmThread::ParticipantA)
                    .col(DmThread::ParticipantB)
                    .unique()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_index(
                Index::drop()
                    .name("idx_dm_thread_org_participants_unique")
                    .table(DmThread::Table)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DmThread::Table)
                    .drop_foreign_key("fk_dm_thread_organization")
                    .drop_column(Alias::new("organization_id"))
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_dm_thread_participants_unique")
                    .table(DmThread::Table)
                    .col(DmThread::ParticipantA)
                    .col(DmThread::ParticipantB)
                    .unique()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}
