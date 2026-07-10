use async_graphql::{ID, InputObject};

use crate::types::GqlAttachmentKind;

#[derive(InputObject)]
pub struct AddAttachmentInput {
    pub task_id: ID,
    pub project_id: ID,
    pub kind: GqlAttachmentKind,
    pub label: String,
    pub url: String,
}
