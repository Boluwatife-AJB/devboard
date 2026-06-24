use serde::{Deserialize, Serialize};
use uuid::Uuid;

macro_rules! define_id {
    ($name:ident) => {
        #[derive(
          Debug, Clone, Copy,
          PartialEq, Eq, Hash,
          Serialize, Deserialize  
        )]
        pub struct $name(pub Uuid);


        impl $name {
          pub fn new() -> Self {
            Self(Uuid::new_v4())
          }
        }

        impl Default for $name {
          fn default() -> Self {
            Self::new()
          }
        }

        impl std::fmt::Display for $name {
          fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", self.0)
          }
        }

        impl From<Uuid> for $name {
          fn from(id: Uuid) -> Self {
            Self(id)
          }
        }

        impl From<$name> for Uuid {
          fn from(id: $name) -> Uuid {
            id.0
          }
        }
    };
}

define_id!(UserId);
define_id!(OrganizationId);
define_id!(TeamId);
define_id!(ProjectId);
define_id!(TaskId);
define_id!(CommentId);