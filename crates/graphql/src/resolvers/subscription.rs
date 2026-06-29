use async_graphql::{Context, ID, Subscription};
use tokio_stream::{Stream, StreamExt, wrappers::errors::BroadcastStreamRecvError};

use devboard_domain::ProjectId;
use devboard_service::{EventBus, TaskEvent};

use crate::{
  context::ContextExt, 
  types::{GqlTask, TaskEventKind, TaskUpdatedEvent}
};

pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    async fn task_updated<'ctx>(
      &self,
      ctx: &Context<'ctx>,
      project_id: ID,
    ) -> async_graphql::Result<impl Stream<Item = TaskUpdatedEvent> + 'ctx> {
      let auth = ctx.authenticated_user()?;

      let project_id: ProjectId = project_id
        .parse::<uuid::Uuid>()
        .map(ProjectId::from)
        .map_err(|_| {
          async_graphql::Error::new("invalid project ID")
        })?;

      let services = ctx.services()?;

      let project = services
        .project_service
        .get_project(project_id, auth.user_id)
        .await
        .map_err(crate::error::to_graphql_error)?;

      let project_key = project.key.clone();

      let event_bus = ctx.data::<EventBus>()?;
      let receiver = event_bus.subscribe_tasks();

      let stream = tokio_stream::wrappers::BroadcastStream::new(receiver)
        .filter_map(move |result| {
          match result {
              Ok(event) => {
                if event.project_id() != project_id {
                  return None;
                }
                Some(task_event_to_gql(event, &project_key))
              }
              Err(BroadcastStreamRecvError::Lagged(n)) => {
                tracing::warn!(
                  skipped = n,
                  "subscription subscriber lagged, events skipped"
                );
                None
              }
          }
        });

      Ok(stream)      
    }
}

fn task_event_to_gql(event: TaskEvent, project_key: &str) -> TaskUpdatedEvent {
  match event {
      TaskEvent::Created { project_id, task } => {
        let _project_key = String::new();
        TaskUpdatedEvent { 
          kind: TaskEventKind::Created, 
          task: Some(GqlTask { 
            inner: task.clone(), 
            project_key: project_key.to_string() 
          }), 
          task_id: ID(task.id.to_string()), 
          project_id: ID(project_id.to_string()) 
        }
      }
      TaskEvent::Updated { project_id, task } => TaskUpdatedEvent { 
        kind: TaskEventKind::Updated, 
        task: Some(GqlTask { 
          inner: task.clone(), 
          project_key: project_key.to_string() 
        }), 
        task_id: ID(task.id.to_string()), 
        project_id: ID(project_id.to_string()) 
      },
      TaskEvent::Deleted { project_id, task_id } => TaskUpdatedEvent { 
        kind: TaskEventKind::Deleted, 
        task: None, 
        task_id: ID(task_id.to_string()), 
        project_id: ID(project_id.to_string()) 
      }
  }
}