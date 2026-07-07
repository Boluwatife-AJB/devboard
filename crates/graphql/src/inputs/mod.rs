pub mod auth;
pub mod project;
pub mod task;
pub mod team;

pub use auth::{AuthPayloadGql, LoginInput, RegisterInput};
pub use project::{AddProjectMemberInput, CreateProjectInput};
pub use task::{AssignTaskInput, CreateTaskInput, UpdateTaskStatusInput};
pub use team::{AddTeamMemberInput, CreateTeamInput, RemoveTeamMemberInput};
