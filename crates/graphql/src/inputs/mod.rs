pub mod auth;
pub mod project;
pub mod task;

pub use auth::{AuthPayloadGql, LoginInput, RegisterInput};
pub use project::{AddProjectMemberInput, CreateProjectInput};
pub use task::{AssignTaskInput, CreateTaskInput, UpdateTaskStatusInput};
