use async_graphql::{ID, SimpleObject};
use chrono::{DateTime, Utc};
use devboard_domain::{OrgMemberProfile, OrgSummary};

use crate::types::team::GqlOrgRole;

#[derive(SimpleObject, Clone)]
pub struct GqlOrgSummary {
    pub id: ID,
    pub name: String,
    pub slug: String,
    pub role: GqlOrgRole,
}

impl From<OrgSummary> for GqlOrgSummary {
    fn from(summary: OrgSummary) -> Self {
        Self {
            id: ID(summary.id.to_string()),
            name: summary.name,
            slug: summary.slug,
            role: summary.role.into(),
        }
    }
}

#[derive(SimpleObject, Clone)]
pub struct GqlOrgMemberProfile {
    pub organization_id: ID,
    pub user_id: ID,
    pub email: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub role: GqlOrgRole,
    pub joined_at: DateTime<Utc>,
}

impl From<OrgMemberProfile> for GqlOrgMemberProfile {
    fn from(profile: OrgMemberProfile) -> Self {
        Self {
            organization_id: ID(profile.organization_id.to_string()),
            user_id: ID(profile.user_id.to_string()),
            email: profile.email,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            role: GqlOrgRole::from(profile.role),
            joined_at: profile.joined_at,
        }
    }
}
