use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Keep the newest reaction when a user has multiple on the same message.
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                DELETE FROM message_reaction a
                USING message_reaction b
                WHERE a.message_id = b.message_id
                  AND a.user_id = b.user_id
                  AND a.emoji <> b.emoji
                  AND (
                    a.created_at < b.created_at
                    OR (a.created_at = b.created_at AND a.emoji > b.emoji)
                  )
                "#,
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE message_reaction
                  DROP CONSTRAINT IF EXISTS message_reaction_pkey
                "#,
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE message_reaction
                  ADD CONSTRAINT message_reaction_pkey
                  PRIMARY KEY (message_id, user_id)
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE message_reaction
                  DROP CONSTRAINT IF EXISTS message_reaction_pkey
                "#,
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE message_reaction
                  ADD CONSTRAINT message_reaction_pkey
                  PRIMARY KEY (message_id, user_id, emoji)
                "#,
            )
            .await?;

        Ok(())
    }
}
