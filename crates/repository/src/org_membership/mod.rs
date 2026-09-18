pub mod pg;

use async_trait::async_trait;
use devboard_domain::{OrgMembership, OrgRole, OrgSummary, OrganizationId, UserId};

use crate::RepositoryError;

#[async_trait]
pub trait OrgMembershipRepository: Send + Sync {
    async fn find(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
    ) -> Result<Option<OrgMembership>, RepositoryError>;

    async fn find_all_for_user(&self, user_id: UserId) -> Result<Vec<OrgSummary>, RepositoryError>;

    async fn list_by_org(
        &self,
        org_id: OrganizationId,
    ) -> Result<Vec<OrgMembership>, RepositoryError>;

    async fn create(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        role: OrgRole,
        display_name: String,
    ) -> Result<OrgMembership, RepositoryError>;

    async fn update_profile(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        display_name: String,
        avatar_url: Option<String>,
    ) -> Result<OrgMembership, RepositoryError>;

    async fn update_role(
        &self,
        user_id: UserId,
        org_id: OrganizationId,
        role: OrgRole,
    ) -> Result<OrgMembership, RepositoryError>;

    async fn delete(&self, user_id: UserId, org_id: OrganizationId) -> Result<(), RepositoryError>;
}

pub(crate) fn org_role_to_str(role: &OrgRole) -> &'static str {
    match role {
        OrgRole::OrgOwner => "ORG_OWNER",
        OrgRole::OrgAdmin => "ORG_ADMIN",
        OrgRole::OrgMember => "ORG_MEMBER",
    }
}

pub(crate) fn str_to_org_role(s: &str) -> Result<OrgRole, RepositoryError> {
    match s {
        "ORG_OWNER" => Ok(OrgRole::OrgOwner),
        "ORG_ADMIN" => Ok(OrgRole::OrgAdmin),
        "ORG_MEMBER" => Ok(OrgRole::OrgMember),
        other => Err(RepositoryError::InvalidData {
            message: format!("unknown org role: {other:?}"),
        }),
    }
}
