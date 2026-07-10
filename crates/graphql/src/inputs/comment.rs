use async_graphql::{ID, InputObject};

#[derive(InputObject)]
pub struct CreateCommentInput {
    pub task_id: ID,
    pub project_id: ID,
    pub body: String,
}

#[derive(InputObject)]
pub struct EditCommentInput {
    pub comment_id: ID,
    pub body: String,
}
