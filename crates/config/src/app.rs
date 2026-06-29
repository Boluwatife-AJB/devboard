use anyhow::{Context, Result};
use serde::Deserialize;

use crate::{
    auth::AuthConfig, database::DatabaseConfig, observability::ObservabilityConfig,
    server::ServerConfig,
};

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub server: ServerConfig,
    pub auth: AuthConfig,
    pub observability: ObservabilityConfig,
}

impl AppConfig {
    pub fn load() -> Result<Self> {
        let _ = dotenvy::dotenv();

        let raw = config::Config::builder()
            .add_source(
                config::Environment::default()
                    .try_parsing(true)
                    .separator("__"),
            )
            .build()
            .context("failed to build config sources")?;

        let database = DatabaseConfig {
            url: raw
                .get_string("database_url")
                .context("DATABASE_URL is required")?,
            max_connections: raw.get_int("database_max_connections").unwrap_or(10) as u32,
            min_connections: raw.get_int("database_min_connections").unwrap_or(2) as u32,
        };

        let server = ServerConfig {
            host: raw
                .get_string("server_host")
                .unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: raw.get_int("server_port").unwrap_or(8080) as u16,
        };

        let auth = AuthConfig {
            jwt_secret: raw
                .get_string("jwt_secret")
                .context("JWT_SECRET is required")?,
            access_token_minutes: raw.get_int("access_token_minutes").unwrap_or(30),
        };

        anyhow::ensure!(
            auth.jwt_secret.len() >= 32,
            "JWT_SECRET must be at least 32 characters (got {})",
            auth.jwt_secret.len()
        );

        let observability = ObservabilityConfig {
            log_filter: raw
                .get_string("rust_log")
                .unwrap_or_else(|_| "devboard=info,sea_orm=warn,tower_http=info".to_string()),
        };

        Ok(AppConfig {
            database,
            server,
            auth,
            observability,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_from_env() {
        let config = AppConfig::load().expect("config should load from .env");
        assert!(!config.database.url.is_empty());
        assert!(!config.auth.jwt_secret.len() >= 32);
        assert_eq!(config.server.port, 8080);
    }
}
