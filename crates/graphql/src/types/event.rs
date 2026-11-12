use async_graphql::{Enum, ID, Object};
use chrono::{DateTime, Utc};
use devboard_domain::{
    EventAudienceType, EventOccurrenceStatus, EventOccurrenceView, EventSeriesStatus, EventType,
    RecurrenceKind,
};

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlEventAudienceType {
    Team,
    Project,
    Organization,
    Custom,
}

impl From<EventAudienceType> for GqlEventAudienceType {
    fn from(v: EventAudienceType) -> Self {
        match v {
            EventAudienceType::Team => Self::Team,
            EventAudienceType::Project => Self::Project,
            EventAudienceType::Organization => Self::Organization,
            EventAudienceType::Custom => Self::Custom,
        }
    }
}

impl From<GqlEventAudienceType> for EventAudienceType {
    fn from(v: GqlEventAudienceType) -> Self {
        match v {
            GqlEventAudienceType::Team => Self::Team,
            GqlEventAudienceType::Project => Self::Project,
            GqlEventAudienceType::Organization => Self::Organization,
            GqlEventAudienceType::Custom => Self::Custom,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlEventType {
    Standup,
    Brainstorm,
    Test,
    CodeReview,
    DesignReview,
    Planning,
    Demo,
    TeamMeeting,
    ProjectMeeting,
    Other,
}

impl From<EventType> for GqlEventType {
    fn from(v: EventType) -> Self {
        match v {
            EventType::Standup => Self::Standup,
            EventType::Brainstorm => Self::Brainstorm,
            EventType::Test => Self::Test,
            EventType::CodeReview => Self::CodeReview,
            EventType::DesignReview => Self::DesignReview,
            EventType::Planning => Self::Planning,
            EventType::Demo => Self::Demo,
            EventType::TeamMeeting => Self::TeamMeeting,
            EventType::ProjectMeeting => Self::ProjectMeeting,
            EventType::Other => Self::Other,
        }
    }
}

impl From<GqlEventType> for EventType {
    fn from(v: GqlEventType) -> Self {
        match v {
            GqlEventType::Standup => Self::Standup,
            GqlEventType::Brainstorm => Self::Brainstorm,
            GqlEventType::Test => Self::Test,
            GqlEventType::CodeReview => Self::CodeReview,
            GqlEventType::DesignReview => Self::DesignReview,
            GqlEventType::Planning => Self::Planning,
            GqlEventType::Demo => Self::Demo,
            GqlEventType::TeamMeeting => Self::TeamMeeting,
            GqlEventType::ProjectMeeting => Self::ProjectMeeting,
            GqlEventType::Other => Self::Other,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlEventSeriesStatus {
    Active,
    Completed,
    Cancelled,
}

impl From<EventSeriesStatus> for GqlEventSeriesStatus {
    fn from(v: EventSeriesStatus) -> Self {
        match v {
            EventSeriesStatus::Active => Self::Active,
            EventSeriesStatus::Completed => Self::Completed,
            EventSeriesStatus::Cancelled => Self::Cancelled,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlEventOccurrenceStatus {
    Scheduled,
    Cancelled,
}

impl From<EventOccurrenceStatus> for GqlEventOccurrenceStatus {
    fn from(v: EventOccurrenceStatus) -> Self {
        match v {
            EventOccurrenceStatus::Scheduled => Self::Scheduled,
            EventOccurrenceStatus::Cancelled => Self::Cancelled,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlEventRecurrenceKind {
    None,
    Daily,
    Weekly,
    Monthly,
    Yearly,
    IntervalDays,
}

impl From<RecurrenceKind> for GqlEventRecurrenceKind {
    fn from(v: RecurrenceKind) -> Self {
        match v {
            RecurrenceKind::None => Self::None,
            RecurrenceKind::Daily => Self::Daily,
            RecurrenceKind::Weekly => Self::Weekly,
            RecurrenceKind::Monthly => Self::Monthly,
            RecurrenceKind::Yearly => Self::Yearly,
            RecurrenceKind::IntervalDays => Self::IntervalDays,
        }
    }
}

impl From<GqlEventRecurrenceKind> for RecurrenceKind {
    fn from(v: GqlEventRecurrenceKind) -> Self {
        match v {
            GqlEventRecurrenceKind::None => Self::None,
            GqlEventRecurrenceKind::Daily => Self::Daily,
            GqlEventRecurrenceKind::Weekly => Self::Weekly,
            GqlEventRecurrenceKind::Monthly => Self::Monthly,
            GqlEventRecurrenceKind::Yearly => Self::Yearly,
            GqlEventRecurrenceKind::IntervalDays => Self::IntervalDays,
        }
    }
}

#[derive(Clone)]
pub struct GqlEventOccurrence {
    pub inner: EventOccurrenceView,
}

impl From<EventOccurrenceView> for GqlEventOccurrence {
    fn from(view: EventOccurrenceView) -> Self {
        Self { inner: view }
    }
}

#[Object]
impl GqlEventOccurrence {
    async fn id(&self) -> ID {
        ID(self.inner.occurrence.id.to_string())
    }

    async fn series_id(&self) -> ID {
        ID(self.inner.series.id.to_string())
    }

    async fn title(&self) -> &str {
        &self.inner.series.title
    }

    async fn description(&self) -> Option<&str> {
        self.inner.series.description.as_deref()
    }

    async fn event_type(&self) -> GqlEventType {
        self.inner.series.event_type.into()
    }

    async fn audience_type(&self) -> GqlEventAudienceType {
        self.inner.series.audience_type.into()
    }

    async fn location(&self) -> Option<&str> {
        self.inner.series.location.as_deref()
    }

    async fn meeting_url(&self) -> Option<&str> {
        self.inner.series.meeting_url.as_deref()
    }

    async fn timezone(&self) -> &str {
        &self.inner.series.timezone
    }

    async fn starts_at(&self) -> DateTime<Utc> {
        self.inner.occurrence.starts_at
    }

    async fn ends_at(&self) -> DateTime<Utc> {
        self.inner.occurrence.ends_at
    }

    async fn status(&self) -> GqlEventOccurrenceStatus {
        self.inner.occurrence.status.into()
    }

    async fn series_status(&self) -> GqlEventSeriesStatus {
        self.inner.series.status.into()
    }

    async fn recurrence_kind(&self) -> GqlEventRecurrenceKind {
        self.inner.series.recurrence_kind.into()
    }

    async fn interval_days(&self) -> Option<i32> {
        self.inner.series.interval_days
    }

    async fn team_id(&self) -> Option<ID> {
        self.inner.series.team_id.map(|id| ID(id.to_string()))
    }

    async fn project_id(&self) -> Option<ID> {
        self.inner.series.project_id.map(|id| ID(id.to_string()))
    }
}
