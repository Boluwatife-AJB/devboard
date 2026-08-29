use async_graphql::InputObject;

#[derive(InputObject)]
pub struct UpdateOrgProfileInput {
    pub display_name: String,
    pub avatar_url: Option<String>,
}
