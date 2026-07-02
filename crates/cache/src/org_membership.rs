use devboard_domain::{OrgMembership, OrganizationId, UserId};
use redis::AsyncCommands;

use crate::{connection::CachePool, error::CacheError};

const MEMBERSHIP_TTL_SECONDS: u64 = 300;

pub struct OrgMembershipCache {
  pool: CachePool
}

impl OrgMembershipCache {
    pub fn new(pool: CachePool) -> Self {
      Self { pool }
    }

    fn key(user_id: UserId, org_id: OrganizationId) -> String {
      format!("org_membership:{}:{}", user_id, org_id)
    }

    pub async fn get(
      &self,
      user_id: UserId,
      org_id: OrganizationId,
    ) -> Result<Option<OrgMembership>, CacheError> {
      let mut conn = self.pool.clone();
      let key = Self::key(user_id, org_id);

      let value: Option<String> = conn.get(&key).await?;

      value
        .map(|v| serde_json::from_str(&v).map_err(CacheError::Serialization))
        .transpose()
    }

    pub async fn set(
      &self,
      membership: &OrgMembership
    ) -> Result<(), CacheError> {
      let mut conn = self.pool.clone();
      let key = Self::key(membership.user_id, membership.organisation_id);
      let value = serde_json::to_string(membership)?;

      conn.set_ex(&key, value, MEMBERSHIP_TTL_SECONDS).await?;
      Ok(())
    }

    pub async fn invalidate(
      &self,
      user_id: UserId,
      org_id: OrganizationId,
    ) -> Result<(), CacheError> {
      let mut conn = self.pool.clone();
      let key = Self::key(user_id, org_id);
      conn.del(&key).await?;  
      Ok(())
    }
}