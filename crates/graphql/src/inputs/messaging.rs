use async_graphql::{ID, InputObject};

use crate::types::GqlChannelKind;

#[derive(InputObject)]
pub struct CreateChannelInput {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub kind: Option<GqlChannelKind>,
}

#[derive(InputObject)]
pub struct AddChannelMemberInput {
    pub channel_id: ID,
    pub user_id: ID,
}

#[derive(InputObject)]
pub struct RemoveChannelMemberInput {
    pub channel_id: ID,
    pub user_id: ID,
}

#[derive(InputObject)]
pub struct SendMessageInput {
    pub channel_id: ID,
    pub body: String,
}

#[derive(InputObject)]
pub struct EditMessageInput {
    pub body: String,
    pub message_id: ID,
}

#[derive(InputObject)]
pub struct DeleteMessageInput {
    pub message_id: ID,
    pub org_id: ID,
}

#[derive(InputObject)]
pub struct ReactionInput {
    pub message_id: ID,
    pub emoji: String,
}

#[derive(InputObject)]
pub struct MarkChannelAsReadInput {
    pub channel_id: ID,
    pub last_message_id: ID,
}

#[derive(InputObject)]
pub struct SendDmInput {
    pub thread_id: ID,
    pub body: String,
}

#[derive(InputObject)]
pub struct EditDmInput {
    pub message_id: ID,
    pub body: String,
}

#[derive(InputObject)]
pub struct DeleteDmInput {
    pub message_id: ID,
}
