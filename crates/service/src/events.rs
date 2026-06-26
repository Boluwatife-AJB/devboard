use devboard_domain::{ProjectId, Task, TaskId};

#[derive(Debug, Clone)]
pub enum TaskEvent {
  Updated {
    project_id: ProjectId,
    task: Task,
  },
  Created {
    project_id: ProjectId,
    task: Task
  },
  Deleted {
    project_id: ProjectId,
    task_id: TaskId
  }
}

impl TaskEvent {
    pub fn project_id(&self) -> ProjectId {
      match self {
          TaskEvent::Updated { project_id, .. } => *project_id,
          TaskEvent::Created { project_id, .. } => *project_id,
          TaskEvent::Deleted { project_id, .. } => *project_id,
      }
    }
}

