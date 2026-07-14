use async_graphql::{Context, ID, Object, dataloader::DataLoader};
use chrono::{DateTime, Utc};
use devboard_domain::Comment;

use crate::{GqlUser, UserLoader};

pub struct GqlComment {
    pub inner: Comment,
}

#[Object]
impl GqlComment {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }

    async fn task_id(&self) -> ID {
        ID(self.inner.task_id.to_string())
    }

    async fn author_id(&self) -> ID {
        ID(self.inner.author_id.to_string())
    }

    async fn author(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<GqlUser>> {
        let loader = ctx.data::<DataLoader<UserLoader>>()?;
        let user = loader.load_one(self.inner.author_id).await?;
        Ok(user.map(GqlUser::from))
    }

    async fn body(&self) -> &str {
        &self.inner.body
    }

    async fn is_edited(&self) -> bool {
        self.inner.is_edited()
    }

    async fn created_at(&self) -> DateTime<Utc> {
        self.inner.created_at
    }

    async fn edited_at(&self) -> Option<DateTime<Utc>> {
        self.inner.edited_at
    }
}

impl From<Comment> for GqlComment {
    fn from(c: Comment) -> Self {
        Self { inner: c }
    }
}
