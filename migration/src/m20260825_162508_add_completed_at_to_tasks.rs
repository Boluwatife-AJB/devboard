use sea_orm_migration::prelude::*;

use crate::m20260621_201248_create_tasks::Task;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Task::Table)
                    .add_column(
                        ColumnDef::new(Alias::new("completed_at"))
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .to_owned(),
            )
            .await?;

        let db = manager.get_connection();
        db.execute_unprepared(
            r#"
            UPDATE task
            SET completed_at = updated_at
            WHERE status = 'DONE' AND completed_at IS NULL
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Task::Table)
                    .drop_column(Alias::new("completed_at"))
                    .to_owned(),
            )
            .await
    }
}
