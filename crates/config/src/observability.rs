use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct ObservabilityConfig {
  #[serde(default = "default_log_filter")]
  pub log_filter: String,
}

fn default_log_filter() -> String {
  "devboard=info,sea_orm=warn,tower_http=info".to_string()
}