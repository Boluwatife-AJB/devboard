use redis::{Client, RedisError, aio::ConnectionManager};

pub type CachePool = ConnectionManager;

pub async fn connect_cache(url: &str) -> Result<CachePool, RedisError> {
  let client = Client::open(url)?;
  ConnectionManager::new(client).await
}