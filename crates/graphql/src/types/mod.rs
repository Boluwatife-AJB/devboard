pub mod scalars;
pub mod user;
pub mod task;
pub mod project;
pub mod subscription;
pub mod pagination;

pub use project::GqlProject;
pub use task::{GqlTask, GqlTaskPriority, GqlTaskStatus};
pub use user::GqlUser;
pub use subscription::{TaskEventKind, TaskUpdatedEvent};