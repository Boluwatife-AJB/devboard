pub mod auth;
pub mod task;
pub mod project;

pub use auth::{AuthPayloadGql, LoginInput, RegisterInput};
pub use project::{CreateProjectInput, AddProjectMemberInput};
pub use task::{AssignTaskInput, CreateTaskInput, UpdateTaskStatusInput};