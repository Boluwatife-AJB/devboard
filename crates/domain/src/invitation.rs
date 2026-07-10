use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{InvitationId, OrganizationId, UserId, organization::OrgRole};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum InvitationStatus {
    Pending,
    Accepted,
    Expired,
    Revoked,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invitation {
    pub id: InvitationId,
    pub organization_id: OrganizationId,
    pub invited_by: UserId,
    pub email: String,
    pub role: OrgRole,
    pub token: String,
    pub status: InvitationStatus,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub accepted_at: Option<DateTime<Utc>>,
}

impl Invitation {
    pub fn is_valid(&self) -> bool {
        self.status == InvitationStatus::Pending && self.expires_at > Utc::now()
    }
}
