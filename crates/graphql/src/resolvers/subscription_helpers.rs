use async_graphql::ID;
use devboard_service::TaskEvent;

use crate::types::{GqlTask, TaskEventKind, TaskUpdatedEvent};

pub fn task_event_to_gql(event: TaskEvent, project_key: &str) -> TaskUpdatedEvent {
    match event {
        TaskEvent::Created { project_id, task } => {
            let _project_key = String::new();
            TaskUpdatedEvent {
                kind: TaskEventKind::Created,
                task: Some(GqlTask {
                    inner: task.clone(),
                    project_key: project_key.to_string(),
                }),
                task_id: ID(task.id.to_string()),
                project_id: ID(project_id.to_string()),
            }
        }
        TaskEvent::Updated { project_id, task } => TaskUpdatedEvent {
            kind: TaskEventKind::Updated,
            task: Some(GqlTask {
                inner: task.clone(),
                project_key: project_key.to_string(),
            }),
            task_id: ID(task.id.to_string()),
            project_id: ID(project_id.to_string()),
        },
        TaskEvent::Deleted {
            project_id,
            task_id,
        } => TaskUpdatedEvent {
            kind: TaskEventKind::Deleted,
            task: None,
            task_id: ID(task_id.to_string()),
            project_id: ID(project_id.to_string()),
        },
    }
}
