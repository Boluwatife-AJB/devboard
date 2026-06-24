use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
  pub url: String,
  #[serde(default = "default_max_connections")]
  pub max_connections: u32,
  #[serde(default = "default_min_connections")]
  pub min_connections: u32
}

fn default_max_connections() -> u32 { 10 }
fn default_min_connections() -> u32 { 2 }