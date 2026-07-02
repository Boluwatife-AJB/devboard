use thiserror::Error;

#[derive(Debug, Error)]
pub enum CacheError {
  #[error("cache connection error: {0}")]
  Connection(#[from] redis::RedisError),

  #[error("serialization error: {0}")]
  Serialization(#[from] serde_json::Error)
}