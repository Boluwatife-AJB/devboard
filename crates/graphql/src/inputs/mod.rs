pub mod attachment;
pub mod auth;
pub mod comment;
pub mod project;
pub mod task;
pub mod team;

pub use attachment::AddAttachmentInput;
pub use auth::{AuthPayloadGql, LoginInput, RegisterInput};
pub use project::{AddProjectMemberInput, CreateProjectInput, UpdateProjectInput};
pub use task::{AssignTaskInput, CreateTaskInput, UpdateTaskStatusInput};
pub use team::{AddTeamMemberInput, CreateTeamInput, RemoveTeamMemberInput};
