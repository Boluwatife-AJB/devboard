use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::ids::UserId;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: UserId,
    pub email: String,
    pub display_name: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicUser {
    pub id: UserId,
    pub email: String,
    pub display_name: String,
    pub created_at: DateTime<Utc>,
}

impl From<User> for PublicUser {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            display_name: u.display_name,
            created_at: u.created_at,
        }
    }
}
