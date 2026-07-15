use chrono::Utc;
use devboard_domain::{PresenceStatus, UserId, UserPresence};
use redis::{AsyncCommands, RedisError, aio::ConnectionManager};

const PRESENCE_TTL_SECONDS: u64 = 90;

fn presence_key(user_id: UserId) -> String {
    format!("presence: {}", user_id)
}

pub struct PresenceService {
    pool: ConnectionManager,
}

impl PresenceService {
    pub fn new(pool: ConnectionManager) -> Self {
        Self { pool }
    }

    #[tracing::instrument(skip(self), fields(user_id = %user_id))]
    pub async fn heartbeat(
        &self,
        user_id: UserId,
        status: PresenceStatus,
    ) -> Result<(), RedisError> {
        let mut conn = self.pool.clone();
        let key = presence_key(user_id);

        let value = match status {
            PresenceStatus::Away => "AWAY",
            PresenceStatus::Offline => "OFFLINE",
            PresenceStatus::Online => "ONLINE",
        };

        let _: () = conn.set_ex(&key, value, PRESENCE_TTL_SECONDS).await?;
        Ok(())
    }

    pub async fn set_offline(&self, user_id: UserId) -> Result<(), RedisError> {
        let mut conn = self.pool.clone();
        let _: () = conn.del(presence_key(user_id)).await?;
        Ok(())
    }

    pub async fn get(&self, user_id: UserId) -> Result<UserPresence, RedisError> {
        let mut conn = self.pool.clone();
        let value: Option<String> = conn.get(presence_key(user_id)).await?;

        let status = match value.as_deref() {
            Some("ONLINE") => PresenceStatus::Online,
            Some("AWAY") => PresenceStatus::Away,
            _ => PresenceStatus::Offline,
        };

        Ok(UserPresence {
            user_id,
            status,
            last_seen: Utc::now(),
        })
    }

    pub async fn get_many(&self, user_ids: Vec<UserId>) -> Result<Vec<UserPresence>, RedisError> {
        if user_ids.is_empty() {
            return Ok(vec![]);
        }

        let mut conn = self.pool.clone();

        let keys: Vec<String> = user_ids.iter().map(|id| presence_key(*id)).collect();

        let values: Vec<Option<String>> =
            redis::cmd("MGET").arg(&keys).query_async(&mut conn).await?;

        let presences = user_ids
            .into_iter()
            .zip(values)
            .map(|(user_id, value)| {
                let status = match value.as_deref() {
                    Some("ONLINE") => PresenceStatus::Online,
                    Some("AWAY") => PresenceStatus::Away,
                    _ => PresenceStatus::Offline,
                };
                UserPresence {
                    user_id,
                    status,
                    last_seen: Utc::now(),
                }
            })
            .collect();

        Ok(presences)
    }
}
