use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{EventOccurrenceId, EventSeriesId, OrganizationId, ProjectId, TeamId, UserId};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventType {
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

impl EventType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Standup => "standup",
            Self::Brainstorm => "brainstorm",
            Self::Test => "test",
            Self::CodeReview => "code_review",
            Self::DesignReview => "design_review",
            Self::Planning => "planning",
            Self::Demo => "demo",
            Self::TeamMeeting => "team_meeting",
            Self::ProjectMeeting => "project_meeting",
            Self::Other => "other",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "standup" => Some(Self::Standup),
            "brainstorm" => Some(Self::Brainstorm),
            "test" => Some(Self::Test),
            "code_review" => Some(Self::CodeReview),
            "design_review" => Some(Self::DesignReview),
            "planning" => Some(Self::Planning),
            "demo" => Some(Self::Demo),
            "team_meeting" => Some(Self::TeamMeeting),
            "project_meeting" => Some(Self::ProjectMeeting),
            "other" => Some(Self::Other),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventAudienceType {
    Team,
    Project,
    Organization,
    Custom,
}

impl EventAudienceType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Team => "team",
            Self::Project => "project",
            Self::Organization => "organization",
            Self::Custom => "custom",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "team" => Some(Self::Team),
            "project" => Some(Self::Project),
            "organization" => Some(Self::Organization),
            "custom" => Some(Self::Custom),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RecurrenceKind {
    None,
    Daily,
    Weekly,
    Monthly,
    Yearly,
    IntervalDays,
}

impl RecurrenceKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Daily => "daily",
            Self::Weekly => "weekly",
            Self::Monthly => "monthly",
            Self::Yearly => "yearly",
            Self::IntervalDays => "interval_days",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "none" => Some(Self::None),
            "daily" => Some(Self::Daily),
            "weekly" => Some(Self::Weekly),
            "monthly" => Some(Self::Monthly),
            "yearly" => Some(Self::Yearly),
            "interval_days" => Some(Self::IntervalDays),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventSeriesStatus {
    Active,
    Completed,
    Cancelled,
    // Postponed,
}

impl EventSeriesStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Completed => "completed",
            Self::Cancelled => "cancelled",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "active" => Some(Self::Active),
            "completed" => Some(Self::Completed),
            "cancelled" => Some(Self::Cancelled),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventOccurrenceStatus {
    Scheduled,
    Cancelled,
}

impl EventOccurrenceStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Scheduled => "scheduled",
            Self::Cancelled => "cancelled",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "scheduled" => Some(Self::Scheduled),
            "cancelled" => Some(Self::Cancelled),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventSeries {
    pub id: EventSeriesId,
    pub organization_id: OrganizationId,
    pub created_by: UserId,
    pub title: String,
    pub description: Option<String>,
    pub event_type: EventType,
    pub audience_type: EventAudienceType,
    pub team_id: Option<TeamId>,
    pub project_id: Option<ProjectId>,
    pub location: Option<String>,
    pub meeting_url: Option<String>,
    pub timezone: String,
    pub duration_minutes: i32,
    pub recurrence_kind: RecurrenceKind,
    pub interval_days: Option<i32>,
    pub recurrence_end_at: Option<DateTime<Utc>>,
    pub status: EventSeriesStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventOccurrence {
    pub id: EventOccurrenceId,
    pub series_id: EventSeriesId,
    pub organization_id: OrganizationId,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
    pub status: EventOccurrenceStatus,
    pub reminded_24h_at: Option<DateTime<Utc>>,
    pub reminded_15m_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventAttendee {
    pub series_id: EventSeriesId,
    pub user_id: UserId,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventOccurrenceView {
    pub occurrence: EventOccurrence,
    pub series: EventSeries,
}

#[derive(Debug, Clone)]
pub struct CreateEventParams {
    pub title: String,
    pub description: Option<String>,
    pub event_type: EventType,
    pub audience_type: EventAudienceType,
    pub team_id: Option<TeamId>,
    pub project_id: Option<ProjectId>,
    pub custom_user_ids: Vec<UserId>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
    pub timezone: String,
    pub location: Option<String>,
    pub meeting_url: Option<String>,
    pub recurrence_kind: RecurrenceKind,
    pub interval_days: Option<i32>,
    pub recurrence_end_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
pub struct UpdateEventParams {
    pub series_id: EventSeriesId,
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_type: Option<EventType>,
    pub audience_type: Option<EventAudienceType>,
    pub team_id: Option<TeamId>,
    pub project_id: Option<ProjectId>,
    pub custom_user_ids: Option<Vec<UserId>>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
    pub timezone: Option<String>,
}
