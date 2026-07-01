use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{UserId, ids::OrganizationId};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrgRole {
    OrgOwner,
    OrgAdmin,
    OrgMember,
}

impl OrgRole {
    pub fn at_least(&self, other: OrgRole) -> bool {
        (*self as u8) >= (other as u8)
    }
}

impl From<OrgRole> for u8 {
    fn from(role: OrgRole) -> u8 {
        match role {
            OrgRole::OrgOwner => 2,
            OrgRole::OrgAdmin => 1,
            OrgRole::OrgMember => 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgMembership {
    pub organisation_id: OrganizationId,
    pub user_id: UserId,
    pub role: OrgRole,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgSummary {
    pub id: OrganizationId,
    pub name: String,
    pub slug: String,
    pub role: OrgRole,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Organization {
    pub id: OrganizationId,
    pub name: String,
    pub slug: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
