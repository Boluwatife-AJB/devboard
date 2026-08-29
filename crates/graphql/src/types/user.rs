use async_graphql::{ID, SimpleObject};
use chrono::{DateTime, Utc};
use devboard_domain::PublicUser;

#[derive(SimpleObject, Clone)]
pub struct GqlUser {
    pub id: ID,
    pub email: String,
    pub created_at: DateTime<Utc>,
}

impl From<PublicUser> for GqlUser {
    fn from(u: PublicUser) -> Self {
        Self {
            id: ID(u.id.to_string()),
            email: u.email,
            created_at: u.created_at,
        }
    }
}
