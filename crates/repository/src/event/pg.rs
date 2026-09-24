use std::collections::HashMap;

use async_trait::async_trait;
use chrono::{DateTime, FixedOffset, Utc};
use devboard_db::entities::{
    event_attendee, event_occurrence, event_series,
    prelude::{
        EventAttendee as EventAttendeeEntity, EventOccurrence as EventOccurrenceEntity,
        EventSeries as EventSeriesEntity,
    },
};
use devboard_domain::{
    EventOccurrence, EventOccurrenceId, EventOccurrenceStatus, EventSeries, EventSeriesId,
    EventSeriesStatus, OrganizationId, UserId,
};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
    QueryOrder, QuerySelect,
};
use uuid::Uuid;

use crate::{
    RepositoryError,
    event::{EventRepository, occurrence_from_model, series_from_model},
};

pub struct PgEventRepository {
    db: DatabaseConnection,
}

impl PgEventRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    async fn occurrences_for_user(
        &self,
        org_id: OrganizationId,
        user_id: UserId,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError> {
        let series_ids: Vec<Uuid> = event_attendee::Entity::find()
            .filter(event_attendee::Column::UserId.eq(Uuid::from(user_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .into_iter()
            .map(|attendee| attendee.series_id)
            .collect();

        if series_ids.is_empty() {
            return Ok(vec![]);
        }

        let from: DateTime<FixedOffset> = from.into();
        let to: DateTime<FixedOffset> = to.into();

        let occ_models = event_occurrence::Entity::find()
            .filter(event_occurrence::Column::OrganizationId.eq(Uuid::from(org_id)))
            .filter(event_occurrence::Column::SeriesId.is_in(series_ids))
            .filter(event_occurrence::Column::Status.eq("scheduled"))
            .filter(event_occurrence::Column::StartsAt.gte(from))
            .filter(event_occurrence::Column::StartsAt.lt(to))
            .order_by_asc(event_occurrence::Column::StartsAt)
            .limit(limit)
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let unique_series_ids: Vec<Uuid> = occ_models.iter().map(|occ| occ.series_id).collect();
        let series_models = event_series::Entity::find()
            .filter(event_series::Column::Id.is_in(unique_series_ids))
            .filter(event_series::Column::Status.eq("active"))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let series_by_id: std::collections::HashMap<_, _> = series_models
            .into_iter()
            .map(|series| (series.id, series))
            .collect();

        let mut out = Vec::new();
        for occ in occ_models {
            let Some(series) = series_by_id.get(&occ.series_id).cloned() else {
                continue;
            };
            out.push((occurrence_from_model(occ)?, series_from_model(series)?));
        }
        Ok(out)
    }

    async fn due_reminders(
        &self,
        window_start: DateTime<Utc>,
        window_end: DateTime<Utc>,
        limit: u64,
        is_24h: bool,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError> {
        let window_start: DateTime<FixedOffset> = window_start.into();
        let window_end: DateTime<FixedOffset> = window_end.into();

        let mut query = event_occurrence::Entity::find()
            .inner_join(event_series::Entity)
            .filter(event_occurrence::Column::Status.eq(EventOccurrenceStatus::Scheduled.as_str()))
            .filter(event_series::Column::Status.eq(EventSeriesStatus::Active.as_str()))
            .filter(event_occurrence::Column::StartsAt.gte(window_start))
            .filter(event_occurrence::Column::StartsAt.lt(window_end));

        query = if is_24h {
            query.filter(event_occurrence::Column::Reminded24hAt.is_null())
        } else {
            query.filter(event_occurrence::Column::Reminded15mAt.is_null())
        };

        let occ_models = query
            .order_by_asc(event_occurrence::Column::StartsAt)
            .limit(limit)
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        self.attach_series(occ_models).await
    }

    async fn attach_series(
        &self,
        occ_models: Vec<event_occurrence::Model>,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError> {
        if occ_models.is_empty() {
            return Ok(vec![]);
        }

        let series_ids: Vec<Uuid> = occ_models.iter().map(|occ| occ.series_id).collect();
        let series_models = event_series::Entity::find()
            .filter(event_series::Column::Id.is_in(series_ids))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let series_by_id: HashMap<Uuid, event_series::Model> = series_models
            .into_iter()
            .map(|series| (series.id, series))
            .collect();

        let mut out = Vec::with_capacity(occ_models.len());
        for occ in occ_models {
            let Some(series) = series_by_id.get(&occ.series_id).cloned() else {
                return Err(RepositoryError::InvalidData {
                    message: format!("occurrence missing series: {}", occ.id),
                });
            };
            out.push((occurrence_from_model(occ)?, series_from_model(series)?));
        }
        Ok(out)
    }
}

#[async_trait]
impl EventRepository for PgEventRepository {
    async fn create_series(&self, series: EventSeries) -> Result<EventSeries, RepositoryError> {
        let now: DateTime<FixedOffset> = series.created_at.into();
        let model = event_series::ActiveModel {
            id: Set(Uuid::from(series.id)),
            organization_id: Set(Uuid::from(series.organization_id)),
            created_by: Set(Uuid::from(series.created_by)),
            title: Set(series.title.clone()),
            description: Set(series.description.clone()),
            event_type: Set(series.event_type.as_str().into()),
            audience_type: Set(series.audience_type.as_str().into()),
            team_id: Set(series.team_id.map(Uuid::from)),
            project_id: Set(series.project_id.map(Uuid::from)),
            location: Set(series.location.clone()),
            meeting_url: Set(series.meeting_url.clone()),
            timezone: Set(series.timezone.clone()),
            duration_minutes: Set(series.duration_minutes),
            recurrence_kind: Set(series.recurrence_kind.as_str().into()),
            interval_days: Set(series.interval_days),
            recurrence_end_at: Set(series.recurrence_end_at.map(|dt| dt.naive_utc())),
            status: Set(series.status.as_str().into()),
            created_at: Set(now),
            updated_at: Set(now),
        };
        let inserted = model
            .insert(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        series_from_model(inserted)
    }

    async fn create_occurrences(
        &self,
        occurrences: &[EventOccurrence],
    ) -> Result<(), RepositoryError> {
        for occ in occurrences {
            let model = event_occurrence::ActiveModel {
                id: Set(Uuid::from(occ.id)),
                series_id: Set(Uuid::from(occ.series_id)),
                organization_id: Set(Uuid::from(occ.organization_id)),
                starts_at: Set(occ.starts_at.into()),
                ends_at: Set(occ.ends_at.into()),
                status: Set(occ.status.as_str().to_string()),
                reminded24h_at: Set(occ.reminded_24h_at.map(Into::into)),
                reminded15m_at: Set(occ.reminded_15m_at.map(Into::into)),
                created_at: Set(occ.created_at.into()),
                updated_at: Set(occ.updated_at.into()),
            };
            model
                .insert(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?;
        }
        Ok(())
    }

    async fn add_attendees(
        &self,
        series_id: EventSeriesId,
        user_ids: &[UserId],
    ) -> Result<(), RepositoryError> {
        let now = Utc::now();
        for user_id in user_ids {
            let model = event_attendee::ActiveModel {
                series_id: Set(Uuid::from(series_id)),
                user_id: Set(Uuid::from(*user_id)),
                created_at: Set(now.into()),
            };
            model
                .insert(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?;
        }
        Ok(())
    }

    async fn find_series_by_id(
        &self,
        id: EventSeriesId,
    ) -> Result<Option<EventSeries>, RepositoryError> {
        let model = event_series::Entity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        model.map(series_from_model).transpose()
    }

    async fn find_occurrence_by_id(
        &self,
        id: EventOccurrenceId,
    ) -> Result<Option<EventOccurrence>, RepositoryError> {
        let model = event_occurrence::Entity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        model.map(occurrence_from_model).transpose()
    }

    async fn list_attendee_ids(
        &self,
        series_id: EventSeriesId,
    ) -> Result<Vec<UserId>, RepositoryError> {
        let rows = event_attendee::Entity::find()
            .filter(event_attendee::Column::SeriesId.eq(Uuid::from(series_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        Ok(rows
            .into_iter()
            .map(|row| UserId::from(row.user_id))
            .collect())
    }

    async fn list_upcoming_events_for_user(
        &self,
        org_id: OrganizationId,
        user_id: UserId,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError> {
        let attendee_series_ids: Vec<Uuid> = EventAttendeeEntity::find()
            .filter(event_attendee::Column::UserId.eq(Uuid::from(user_id)))
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .into_iter()
            .map(|attendee| attendee.series_id)
            .collect();

        if attendee_series_ids.is_empty() {
            return Ok(vec![]);
        }

        let occs = EventOccurrenceEntity::find()
            .filter(event_occurrence::Column::OrganizationId.eq(Uuid::from(org_id)))
            .filter(event_occurrence::Column::SeriesId.is_in(attendee_series_ids))
            .filter(event_occurrence::Column::Status.eq("SCHEDULED"))
            .filter(event_occurrence::Column::StartsAt.gte(from))
            .filter(event_occurrence::Column::StartsAt.lt(to))
            .order_by_asc(event_occurrence::Column::StartsAt)
            .limit(limit)
            .all(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;

        let mut out = Vec::with_capacity(occs.len());
        for occ in occs {
            let series = EventSeriesEntity::find_by_id(occ.series_id)
                .one(&self.db)
                .await
                .map_err(RepositoryError::from_db_err)?
                .ok_or_else(|| RepositoryError::InvalidData {
                    message: "occurrence missing series".into(),
                })?;
            if series.status != "ACTIVE" {
                continue;
            }
            out.push((occurrence_from_model(occ)?, series_from_model(series)?));
        }
        Ok(out)
    }

    async fn list_occurrences_for_user(
        &self,
        org_id: OrganizationId,
        user_id: UserId,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError> {
        self.occurrences_for_user(org_id, user_id, from, to, limit)
            .await
    }

    async fn update_series_meta(
        &self,
        series: &EventSeries,
    ) -> Result<EventSeries, RepositoryError> {
        let model = event_series::Entity::find_by_id(Uuid::from(series.id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;
        let mut active: event_series::ActiveModel = model.into();
        active.title = Set(series.title.clone());
        active.description = Set(series.description.clone());
        active.audience_type = Set(series.audience_type.as_str().to_string());
        active.event_type = Set(series.event_type.as_str().to_string());
        active.team_id = Set(series.team_id.map(Uuid::from));
        active.project_id = Set(series.project_id.map(Uuid::from));
        active.location = Set(series.location.clone());
        active.meeting_url = Set(series.meeting_url.clone());
        active.timezone = Set(series.timezone.clone());
        active.duration_minutes = Set(series.duration_minutes);
        active.recurrence_kind = Set(series.recurrence_kind.as_str().to_string());
        active.interval_days = Set(series.interval_days);
        active.recurrence_end_at = Set(series.recurrence_end_at.map(|dt| dt.naive_utc()));
        active.updated_at = Set(Utc::now().into());
        let updated = active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        series_from_model(updated)
    }
    async fn cancel_series(&self, id: EventSeriesId) -> Result<(), RepositoryError> {
        let model = event_series::Entity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;
        let mut active: event_series::ActiveModel = model.into();
        active.status = Set(EventSeriesStatus::Cancelled.as_str().to_string());
        active.updated_at = Set(Utc::now().into());
        active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        Ok(())
    }
    async fn cancel_occurrence(&self, id: EventOccurrenceId) -> Result<(), RepositoryError> {
        let model = event_occurrence::Entity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;
        let mut active: event_occurrence::ActiveModel = model.into();
        active.status = Set(EventOccurrenceStatus::Cancelled.as_str().to_string());
        active.updated_at = Set(Utc::now().into());
        active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        Ok(())
    }
    async fn find_due_reminders_24h(
        &self,
        window_start: DateTime<Utc>,
        window_end: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError> {
        self.due_reminders(window_start, window_end, limit, true)
            .await
    }
    async fn find_due_reminders_15m(
        &self,
        window_start: DateTime<Utc>,
        window_end: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<(EventOccurrence, EventSeries)>, RepositoryError> {
        self.due_reminders(window_start, window_end, limit, false)
            .await
    }
    async fn mark_reminded_24h(&self, id: EventOccurrenceId) -> Result<(), RepositoryError> {
        let model = event_occurrence::Entity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;
        let now = Utc::now();
        let mut active: event_occurrence::ActiveModel = model.into();
        active.reminded24h_at = Set(Some(now.into()));
        active.updated_at = Set(now.into());
        active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        Ok(())
    }
    async fn mark_reminded_15m(&self, id: EventOccurrenceId) -> Result<(), RepositoryError> {
        let model = event_occurrence::Entity::find_by_id(Uuid::from(id))
            .one(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?
            .ok_or(RepositoryError::NotFound)?;
        let now = Utc::now();
        let mut active: event_occurrence::ActiveModel = model.into();
        active.reminded15m_at = Set(Some(now.into()));
        active.updated_at = Set(now.into());
        active
            .update(&self.db)
            .await
            .map_err(RepositoryError::from_db_err)?;
        Ok(())
    }
}
