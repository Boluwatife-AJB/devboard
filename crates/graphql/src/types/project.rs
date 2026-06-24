use async_graphql::{ID, SimpleObject};
use chrono::{DateTime, Utc};
use devboard_domain::Project;

#[derive(SimpleObject, Clone)]
pub struct GqlProject {
  pub id: ID,
  pub organization_id: ID,
  pub team_id: ID,
  pub name: String,
  pub key: String,
  pub description: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>
}

impl From<Project> for GqlProject {
    fn from(p: Project) -> Self {
        Self { 
          id: ID(p.id.to_string()), 
          organization_id: ID(p.organization_id.to_string()),
          team_id: ID(p.team_id.to_string()), 
          name: p.name, 
          key: p.key, 
          description: p.description, 
          created_at: p.created_at, 
          updated_at: p.updated_at 
        }
    }
}