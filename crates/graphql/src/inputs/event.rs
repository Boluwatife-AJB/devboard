use async_graphql::{ID, InputObject};
use chrono::{DateTime, Utc};

use crate::types::event::{GqlEventAudienceType, GqlEventRecurrenceKind, GqlEventType};

#[derive(InputObject)]
pub struct CreateEventInput {
    pub title: String,
    pub description: Option<String>,
    pub event_type: GqlEventType,
    pub audience_type: GqlEventAudienceType,
    pub team_id: Option<ID>,
    pub project_id: Option<ID>,
    pub custom_user_ids: Option<Vec<ID>>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
    pub timezone: String,
    pub location: Option<String>,
    pub meeting_url: Option<String>,
    pub recurrence_kind: GqlEventRecurrenceKind,
    pub interval_days: Option<i32>,
    pub recurrence_end_at: Option<DateTime<Utc>>,
}

#[derive(InputObject)]
pub struct CancelEventInput {
    pub series_id: ID,
    pub occurrence_id: Option<ID>,
}
