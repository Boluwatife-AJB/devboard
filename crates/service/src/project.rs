use std::sync::Arc;

use devboard_domain::{
    Action, OrgMembership, Project, ProjectId, ProjectMembership, ProjectRole, TeamId, UserId, can,
};
use devboard_repository::{ProjectRepository, TeamRepository};

use crate::{
    authorize, error::ServiceError, load_project_context, load_team_context, require_team_in_org,
};

pub struct ProjectService {
    project_repo: Arc<dyn ProjectRepository>,
    team_repo: Arc<dyn TeamRepository>,
}

impl ProjectService {
    pub fn new(
        project_repo: Arc<dyn ProjectRepository>,
        team_repo: Arc<dyn TeamRepository>,
    ) -> Self {
        Self {
            project_repo,
            team_repo,
        }
    }

    #[tracing::instrument(skip(self, caller_org))]
    pub async fn list_projects(
        &self,
        caller_org: &OrgMembership,
    ) -> Result<Vec<Project>, ServiceError> {
        let org_id = caller_org.organization_id;
        let caller_id = caller_org.user_id;

        let projects = self
            .project_repo
            .find_by_organization(org_id)
            .await
            .map_err(ServiceError::from)?;

        let mut visible = Vec::new();
        for project in projects {
            let (ctx, _) = load_project_context(
                caller_org,
                &self.team_repo,
                &self.project_repo,
                project.id,
                caller_id,
            )
            .await?;

            if can(&ctx, Action::ViewProject) {
                visible.push(project);
            }
        }

        Ok(visible)
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(project_id = %project_id)
    )]
    pub async fn get_project(
        &self,
        caller_org: &OrgMembership,
        project_id: ProjectId,
    ) -> Result<Project, ServiceError> {
        let (ctx, project) = load_project_context(
            caller_org,
            &self.team_repo,
            &self.project_repo,
            project_id,
            caller_org.user_id,
        )
        .await?;

        if !can(&ctx, Action::ViewProject) {
            return Err(ServiceError::ProjectNotFound {
                id: project_id.to_string(),
            });
        }

        Ok(project)
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(team_id = %team_id)
    )]
    pub async fn create_project(
        &self,
        caller_org: &OrgMembership,
        team_id: TeamId,
        name: String,
        key: String,
        description: Option<String>,
    ) -> Result<Project, ServiceError> {
        validate_project_name(&name)?;
        validate_project_key(&key)?;

        require_team_in_org(&self.team_repo, team_id, caller_org.organization_id).await?;

        let ctx =
            load_team_context(caller_org, &self.team_repo, team_id, caller_org.user_id).await?;
        authorize(&ctx, Action::CreateProject)?;

        let project_id = ProjectId::new();

        let project = self
            .project_repo
            .create(
                project_id,
                caller_org.organization_id,
                team_id,
                name,
                key.to_uppercase(),
                description,
            )
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Conflict {
                        message: "a project with this key already exists in the organization"
                            .into(),
                    }
                }
                other => ServiceError::from(other),
            })?;

        Ok(project)
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(project_id = %project_id)
    )]
    pub async fn update_project(
        &self,
        caller_org: &OrgMembership,
        project_id: ProjectId,
        name: Option<String>,
        description: Option<String>,
    ) -> Result<Project, ServiceError> {
        let (ctx, _) = load_project_context(
            caller_org,
            &self.team_repo,
            &self.project_repo,
            project_id,
            caller_org.user_id,
        )
        .await?;
        authorize(&ctx, Action::UpdateProject)?;

        if let Some(ref n) = name
            && n.trim().is_empty()
        {
            return Err(ServiceError::Validation {
                field: "name".into(),
                message: "project name cannot be empty".into(),
            });
        }

        self.project_repo
            .update(project_id, name, description)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::ProjectNotFound {
                    id: project_id.to_string(),
                },
                other => ServiceError::from(other),
            })
    }

    #[tracing::instrument(
      skip(self, caller_org),
      fields(project_id = %project_id, user_id = %user_id)
    )]
    pub async fn add_member(
        &self,
        caller_org: &OrgMembership,
        project_id: ProjectId,
        user_id: UserId,
        role_override: Option<ProjectRole>,
    ) -> Result<ProjectMembership, ServiceError> {
        let (ctx, _) = load_project_context(
            caller_org,
            &self.team_repo,
            &self.project_repo,
            project_id,
            caller_org.user_id,
        )
        .await?;
        authorize(&ctx, Action::ManageProjectMembers)?;

        self.project_repo
            .add_member(project_id, user_id, role_override)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::UniqueViolation { .. } => {
                    ServiceError::Conflict {
                        message: "user is already a member of this project".into(),
                    }
                }
                devboard_repository::RepositoryError::ForeignKeyViolation => {
                    ServiceError::UserNotFound {
                        id: user_id.to_string(),
                    }
                }
                other => ServiceError::from(other),
            })
    }

    #[tracing::instrument(skip(self, caller_org), fields(project_id = %project_id))]
    pub async fn delete_project(
        &self,
        caller_org: &OrgMembership,
        project_id: ProjectId,
    ) -> Result<(), ServiceError> {
        let (ctx, _) = load_project_context(
            caller_org,
            &self.team_repo,
            &self.project_repo,
            project_id,
            caller_org.user_id,
        )
        .await?;
        authorize(&ctx, Action::DeleteProject)?;

        self.project_repo
            .delete(project_id)
            .await
            .map_err(|err| match err {
                devboard_repository::RepositoryError::NotFound => ServiceError::ProjectNotFound {
                    id: project_id.to_string(),
                },
                other => ServiceError::from(other),
            })
    }
}

fn validate_project_name(name: &str) -> Result<(), ServiceError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(ServiceError::Validation {
            field: "name".into(),
            message: "project name is required".into(),
        });
    }
    if name.len() > 100 {
        return Err(ServiceError::Validation {
            field: "name".into(),
            message: "project name must be 100 characters or fewer".into(),
        });
    }
    Ok(())
}

fn validate_project_key(key: &str) -> Result<(), ServiceError> {
    let key = key.trim();
    if key.is_empty() {
        return Err(ServiceError::Validation {
            field: "key".into(),
            message: "project key is required".into(),
        });
    }
    if key.len() > 10 {
        return Err(ServiceError::Validation {
            field: "key".into(),
            message: "project key  must be 10 characters or fewer".into(),
        });
    }
    if !key.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(ServiceError::Validation {
            field: "key".into(),
            message: "project key must contain only letters and numbers".into(),
        });
    }

    Ok(())
}
