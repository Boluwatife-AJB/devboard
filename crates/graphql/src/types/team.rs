use async_graphql::{Context, Enum, ID, Object, dataloader::DataLoader};
use chrono::{DateTime, Utc};
use devboard_domain::{OrgMembership, OrgRole, Team, TeamMembership, TeamRole};

use crate::{GqlUser, UserLoader};

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlTeamRole {
    Owner,
    Admin,
    Member,
}

impl From<TeamRole> for GqlTeamRole {
    fn from(r: TeamRole) -> Self {
        match r {
            TeamRole::Owner => Self::Owner,
            TeamRole::Admin => Self::Admin,
            TeamRole::Member => Self::Member,
        }
    }
}

impl From<GqlTeamRole> for TeamRole {
    fn from(r: GqlTeamRole) -> Self {
        match r {
            GqlTeamRole::Owner => Self::Owner,
            GqlTeamRole::Admin => Self::Admin,
            GqlTeamRole::Member => Self::Member,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlOrgRole {
    OrgOwner,
    OrgAdmin,
    OrgMember,
}

impl From<OrgRole> for GqlOrgRole {
    fn from(r: OrgRole) -> Self {
        match r {
            OrgRole::OrgOwner => Self::OrgOwner,
            OrgRole::OrgAdmin => Self::OrgAdmin,
            OrgRole::OrgMember => Self::OrgMember,
        }
    }
}

#[derive(Clone)]
pub struct GqlTeam {
    pub inner: Team,
}

#[Object]
impl GqlTeam {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }

    async fn organization_id(&self) -> ID {
        ID(self.inner.organization_id.to_string())
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn created_at(&self) -> DateTime<Utc> {
        self.inner.created_at
    }

    async fn updated_at(&self) -> DateTime<Utc> {
        self.inner.updated_at
    }
}

#[derive(Clone)]
pub struct GqlTeamMember {
    pub inner: TeamMembership,
}

#[Object]
impl GqlTeamMember {
    async fn team_id(&self) -> ID {
        ID(self.inner.team_id.to_string())
    }

    async fn user_id(&self) -> ID {
        ID(self.inner.user_id.to_string())
    }

    async fn role(&self) -> GqlTeamRole {
        GqlTeamRole::from(self.inner.role)
    }

    async fn joined_at(&self) -> DateTime<Utc> {
        self.inner.joined_at
    }

    async fn user(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<GqlUser>> {
        let loader = ctx.data::<DataLoader<UserLoader>>()?;
        let user = loader.load_one(self.inner.user_id).await?;

        Ok(user.map(GqlUser::from))
    }
}

#[derive(Clone)]
pub struct GqlOrgMember {
    pub inner: OrgMembership,
}

#[Object]
impl GqlOrgMember {
    async fn user_id(&self) -> ID {
        ID(self.inner.user_id.to_string())
    }

    async fn role(&self) -> GqlOrgRole {
        GqlOrgRole::from(self.inner.role)
    }

    async fn display_name(&self) -> &str {
        &self.inner.display_name
    }

    async fn avatar_url(&self) -> Option<&str> {
        self.inner.avatar_url.as_deref()
    }

    async fn joined_at(&self) -> DateTime<Utc> {
        self.inner.joined_at
    }

    async fn user(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<GqlUser>> {
        let loader = ctx.data::<DataLoader<UserLoader>>()?;
        let user = loader.load_one(self.inner.user_id).await?;

        Ok(user.map(GqlUser::from))
    }
}
