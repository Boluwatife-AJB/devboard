use std::time::Duration;

use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};

pub struct DbConnectOptions {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

pub async fn connect(options: DbConnectOptions) -> Result<DatabaseConnection, DbErr> {
    let mut connect_options = ConnectOptions::new(options.url);

    connect_options
        .max_connections(options.max_connections)
        .min_connections(options.min_connections)
        .connect_timeout(Duration::from_secs(8))
        .acquire_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(300))
        .max_lifetime(Duration::from_secs(1800))
        .sqlx_logging(true)
        .sqlx_logging_level(tracing::log::LevelFilter::Debug);

    Database::connect(connect_options).await
}
