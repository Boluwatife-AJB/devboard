use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::ids::OrganizationId;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Organization {
    pub id: OrganizationId,
    pub name: String,
    pub slug: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
