use redis::{Client, RedisError, aio::ConnectionManager};

pub type CachePool = ConnectionManager;

/// Shared Redis handles: a multiplexed command pool plus a client for pub/sub.
pub struct CacheConnections {
    pub pool: CachePool,
    pub client: Client,
}

pub async fn connect_cache(url: &str) -> Result<CacheConnections, RedisError> {
    let client = Client::open(url)?;
    let pool = ConnectionManager::new(client.clone()).await?;
    Ok(CacheConnections { pool, client })
}
