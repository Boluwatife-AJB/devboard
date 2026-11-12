use async_trait::async_trait;
use chrono::{DateTime, Utc};
use devboard_domain::{
    EventAudienceType, EventOccurrence, EventOccurrenceId, EventOccurrenceStatus, EventSeries,
    EventSeriesId, EventSeriesStatus, EventType, OrganizationId, ProjectId, RecurrenceKind, TeamId,
    UserId,
};

use crate::RepositoryError;

pub mod pg;

#[async_trait]
pub trait EventRepository: Send + Sync {
    async fn create_series(&self, series: EventSeries) -> Result<EventSeries, RepositoryError>;

    async fn create_occurrences(
        &self,
        occurrence: &[EventOccurrence],
    ) -> Result<(), RepositoryError>;

    async fn add_attendees(
        &self,
        series_id: EventSeriesId,
        user_ids: &[UserId],
    ) -> Result<(), RepositoryError>;

    async fn find_series_by_id(
        &self,
        id: EventSeriesId,
    ) -> Result<Option<EventSeries>, RepositoryError>;

    async fn find_occurrence_by_id(
        &self,
        id: EventOccurrenceId,
    ) -> Result<Option<EventOccurrence>, RepositoryError>;

    async fn list_attendee_ids(
        &self,
        series_id: EventSeriesId,
    ) -> Result<Vec<UserId>, RepositoryError>;

    async fn list_upcoming_events_for_user(
        &self,
        org_id: OrganizationId,
        user_id: UserId,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError>;

    async fn list_occurrences_for_user(
        &self,
        org_id: OrganizationId,
        user_id: UserId,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError>;

    async fn update_series_meta(
        &self,
        series: &EventSeries,
    ) -> Result<EventSeries, RepositoryError>;

    async fn cancel_series(&self, id: EventSeriesId) -> Result<(), RepositoryError>;

    async fn cancel_occurrence(&self, id: EventOccurrenceId) -> Result<(), RepositoryError>;

    async fn find_due_reminders_24h(
        &self,
        window_start: DateTime<Utc>,
        window_end: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError>;

    async fn find_due_reminders_15m(
        &self,
        window_start: DateTime<Utc>,
        window_end: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError>;

    async fn mark_reminded_24h(&self, id: EventOccurrenceId) -> Result<(), RepositoryError>;

    async fn mark_reminded_15m(&self, id: EventOccurrenceId) -> Result<(), RepositoryError>;
}

// Series from model
pub(crate) fn series_from_model(
    model: devboard_db::entities::event_series::Model,
) -> Result<EventSeries, RepositoryError> {
    let event_type =
        EventType::parse(&model.event_type).ok_or_else(|| RepositoryError::InvalidData {
            message: format!("Invalid event type: {}", model.event_type),
        })?;

    let audience_type = EventAudienceType::parse(&model.audience_type).ok_or_else(|| {
        RepositoryError::InvalidData {
            message: format!("Invalid audience type: {}", model.audience_type),
        }
    })?;

    let recurrence_kind = RecurrenceKind::parse(&model.recurrence_kind).ok_or_else(|| {
        RepositoryError::InvalidData {
            message: format!("Invalid recurrence kind: {}", model.recurrence_kind),
        }
    })?;

    let status =
        EventSeriesStatus::parse(&model.status).ok_or_else(|| RepositoryError::InvalidData {
            message: format!("Invalid status: {}", model.status),
        })?;

    Ok(EventSeries {
        id: devboard_domain::EventSeriesId::from(model.id),
        organization_id: devboard_domain::OrganizationId::from(model.organization_id),
        created_by: devboard_domain::UserId::from(model.created_by),
        title: model.title,
        description: model.description,
        event_type,
        audience_type,
        team_id: model.team_id.map(TeamId::from),
        project_id: model.project_id.map(ProjectId::from),
        location: model.location,
        meeting_url: model.meeting_url,
        timezone: model.timezone,
        duration_minutes: model.duration_minutes,
        recurrence_kind,
        interval_days: model.interval_days,
        recurrence_end_at: model.recurrence_end_at.map(|dt| dt.and_utc()),
        status,
        created_at: model.created_at.into(),
        updated_at: model.updated_at.into(),
    })
}

// Occurrence from model
pub(crate) fn occurrence_from_model(
    model: devboard_db::entities::event_occurrence::Model,
) -> Result<EventOccurrence, RepositoryError> {
    Ok(EventOccurrence {
        id: EventOccurrenceId::from(model.id),
        series_id: EventSeriesId::from(model.series_id),
        organization_id: devboard_domain::OrganizationId::from(model.organization_id),
        starts_at: model.starts_at.into(),
        ends_at: model.ends_at.into(),
        status: EventOccurrenceStatus::parse(&model.status).ok_or_else(|| {
            RepositoryError::InvalidData {
                message: format!("Invalid status: {}", model.status),
            }
        })?,
        reminded_24h_at: model.reminded24h_at.map(Into::into),
        reminded_15m_at: model.reminded15m_at.map(Into::into),
        created_at: model.created_at.into(),
        updated_at: model.updated_at.into(),
    })
}
