use async_graphql::{Context, ID, Subscription};
use async_stream::stream;
use tokio_stream::Stream;

use crate::types::GqlTask;

pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    async fn task_updated(
      &self,
      _ctx: &Context<'_>,
      _project_id: ID,
    ) -> impl Stream<Item = GqlTask> {
      tokio_stream::empty()
      
    }
}