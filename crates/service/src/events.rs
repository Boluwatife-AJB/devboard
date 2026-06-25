use devboard_domain::ProjectId;

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
    task_id: devboard_domain::TaskId
  }
}