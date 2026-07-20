pub mod attachment;
pub mod auth;
pub mod comment;
pub mod messaging;
pub mod project;
pub mod task;
pub mod team;

pub use attachment::AddAttachmentInput;
pub use auth::{AuthPayloadGql, LoginInput, RegisterInput};
pub use messaging::{
    CreateChannelInput, DeleteMessageInput, EditMessageInput, MarkChannelAsReadInput,
    ReactionInput, SendDmInput, SendMessageInput,
};
pub use project::{AddProjectMemberInput, CreateProjectInput, UpdateProjectInput};
pub use task::{AssignTaskInput, CreateTaskInput, UpdateTaskStatusInput};
pub use team::{AddTeamMemberInput, CreateTeamInput, RemoveTeamMemberInput};
