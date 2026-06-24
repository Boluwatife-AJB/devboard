use std::sync::Arc;

use devboard_domain::{OrganizationId, Project, ProjectId, ProjectMembership, ProjectRole, TeamId, UserId};
use devboard_repository::{ProjectRepository, TeamRepository};

use crate::error::ServiceError;

pub struct ProjectService {
  project_repo: Arc<dyn ProjectRepository>,
  team_repo: Arc<dyn TeamRepository>
}

impl ProjectService {
    pub fn new(
      project_repo: Arc<dyn ProjectRepository>,
      team_repo: Arc<dyn TeamRepository>,
    ) -> Self {
      Self { project_repo, team_repo }
    }

    #[tracing::instrument(
      skip(self),
      fields(org_id = %org_id, caller_id = %caller_id)
    )]
    pub async fn list_projects(
      &self,
      org_id: OrganizationId,
      caller_id: UserId,
    ) -> Result<Vec<Project>, ServiceError> {
      let projects = self
        .project_repo
        .find_by_organization(org_id)
        .await
        .map_err(ServiceError::from)?;

      let mut visible = Vec::new();
      for project in projects {
        let (team_m, project_m) = tokio::try_join!(
          self.team_repo.get_membership(project.team_id, caller_id),
          self.project_repo.get_membership(project.id, caller_id)
        )
        .map_err(ServiceError::from)?;

        if devboard_domain::has_project_permission(
          team_m.as_ref(), 
          project_m.as_ref(), 
          ProjectRole::Viewer
        ) {
          visible.push(project);
        }
      }

      Ok(visible)
    }

    #[tracing::instrument(
      skip(self),
      fields(project_id = %project_id, caller_id = %caller_id)
    )]
    pub async fn get_project(
      &self,
      project_id: ProjectId,
      caller_id: UserId
    ) -> Result<Project, ServiceError> {
      let project = self
        .project_repo
        .find_by_id(project_id)
        .await?
        .ok_or_else(|| ServiceError::ProjectNotFound { 
          id: project_id.to_string() 
        })?;

      let (team_m, project_m) = tokio::try_join!(
        self.team_repo.get_membership(project.team_id, caller_id),
        self.project_repo.get_membership(project_id, caller_id)
      )?;

      if !devboard_domain::has_project_permission(
        team_m.as_ref(), 
        project_m.as_ref(), 
        ProjectRole::Viewer
      ) {
        return Err(ServiceError::ProjectNotFound { 
          id: project_id.to_string() 
        });
      }

      Ok(project)
    }

    #[tracing::instrument(
      skip(self),
      fields(org_id = %organization_id, team_id = %team_id, caller_id = %caller_id)
    )]
    pub async fn create_project(
      &self,
      organization_id: OrganizationId,
      team_id: TeamId,
      caller_id: UserId,
      name: String,
      key: String,
      description: Option<String>
    ) -> Result<Project, ServiceError> {
      validate_project_name(&name)?;
      validate_project_key(&key)?;

      let team_membership = self
        .team_repo
        .get_membership(team_id, caller_id)
        .await
        .map_err(ServiceError::from)?
        .ok_or(ServiceError::Forbidden { 
          reason: "must be a team member to create projects".into() 
        })?;
        
      if !team_membership.role.at_least(
        devboard_domain::TeamRole::Admin
      ) {
        return Err(ServiceError::Forbidden { 
          reason: "requires team Admin role to create projects".into() 
        });
      }

      let project_id = ProjectId::new();

      let project = self
        .project_repo
        .create(
          project_id, 
          organization_id, 
          team_id, 
          name, 
          key.to_uppercase(), 
          description
        )
        .await
        .map_err(|err| match err {
            devboard_repository::RepositoryError::UniqueViolation {
               .. 
              } => ServiceError::Conflict { 
                message: "a project with this key already exists \
                in the organization"
                .into(), 
              },
              other => ServiceError::from(other),
        })?;

        self.project_repo
            .add_member(
              project_id, 
              caller_id, 
              Some(ProjectRole::Owner)
            )
            .await
            .map_err(ServiceError::from)?;

      Ok(project)
    }

    #[tracing::instrument(
      skip(self),
      fields(project_id = %project_id, user_id = %user_id, caller_id = %caller_id)
    )]
    pub async fn add_member(
      &self,
      project_id: ProjectId,
      caller_id: UserId,
      user_id: UserId,
      role_override: Option<ProjectRole>
    ) -> Result<ProjectMembership, ServiceError> {
      let project = self
        .project_repo
        .find_by_id(project_id)
        .await?
        .ok_or_else(|| ServiceError::ProjectNotFound { 
          id: project_id.to_string() 
        })?;

      let (caller_team_m, caller_project_m) = tokio::try_join!(
        self.team_repo.get_membership(project.team_id, caller_id),
        self.project_repo.get_membership(project_id, caller_id)
      )?;

      if !devboard_domain::has_project_permission(
        caller_team_m.as_ref(), 
        caller_project_m.as_ref(), 
        ProjectRole::Admin
      ) {
        return Err(ServiceError::Forbidden { 
          reason: "requires Admin access to add project members".into() 
        });
      }

      self.project_repo
        .add_member(project_id, user_id, role_override)
        .await
        .map_err(|err| match err {
            devboard_repository::RepositoryError::UniqueViolation { 
              .. 
            } => ServiceError::Conflict { 
              message: "user is already a member of this project".into(), 
            },
            devboard_repository::RepositoryError::ForeignKeyViolation => {
              ServiceError::UserNotFound { 
                id: user_id.to_string() 
              }
            }
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
    return Err(ServiceError::Validation { field: "name".into(), message: "project name must be 100 characters or fewer".into() })
  }
  Ok(())
}

fn validate_project_key(key: &str) -> Result<(), ServiceError> {
  let key = key.trim();
  if key.is_empty() {
    return Err(ServiceError::Validation { 
      field: "key".into(), 
      message: "project key is required".into(), 
    })
  }
  if key.len() > 10 {
    return Err(ServiceError::Validation { 
      field: "key".into(), 
      message: "project key  must be 10 characters or fewer".into() 
    });
  }
  if !key.chars().all(|c| c.is_ascii_alphanumeric()) {
    return Err(ServiceError::Validation { 
      field: "key".into(), 
      message: "project key must contain only letters and numbers".into() 
    });
  }

  Ok(())
}