use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AuthConfig {
  pub jwt_secret: String, 
  #[serde(default = "default_access_token_minutes")]
  pub access_token_minutes: i64,
}

fn default_access_token_minutes() -> i64 { 30 }