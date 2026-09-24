use std::{collections::HashSet, sync::Arc};

use chrono::{DateTime, Duration, Utc};
use devboard_domain::{
    CreateEventParams, EffectiveContext, EventAudienceType, EventOccurrence, EventOccurrenceId,
    EventOccurrenceStatus, EventOccurrenceView, EventSeries, EventSeriesId, EventSeriesStatus,
    OrgMembership, OrgRole, OrganizationId, ProjectId, ProjectRole, RecurrenceKind, Task, TaskId,
    TeamRole, UserId, effective_project_role,
};
use devboard_repository::{
    EventRepository, OrgMembershipRepository, ProjectRepository, TeamRepository,
};

use crate::{
    NotificationService, ServiceError, authz::org_context, load_project_context, load_team_context,
    require_team_in_org,
};

const OCCURRENCE_HORIZON_DAYS: i64 = 90;

pub struct EventService {
    event_repo: Arc<dyn EventRepository>,
    org_membership_repo: Arc<dyn OrgMembershipRepository>,
    team_repo: Arc<dyn TeamRepository>,
    project_repo: Arc<dyn ProjectRepository>,
    notification_service: Arc<NotificationService>,
}

impl EventService {
    pub fn new(
        event_repo: Arc<dyn EventRepository>,
        org_membership_repo: Arc<dyn OrgMembershipRepository>,
        team_repo: Arc<dyn TeamRepository>,
        project_repo: Arc<dyn ProjectRepository>,
        notification_service: Arc<NotificationService>,
    ) -> Self {
        Self {
            event_repo,
            org_membership_repo,
            team_repo,
            project_repo,
            notification_service,
        }
    }

    pub async fn create_event(
        &self,
        caller: &OrgMembership,
        caller_id: UserId,
        params: CreateEventParams,
    ) -> Result<EventOccurrenceView, ServiceError> {
        self.validate_create(&params)?;

        let ctx = self
            .build_create_context(caller, caller_id, &params)
            .await?;
        if !can_create_event(&ctx, params.audience_type) {
            return Err(ServiceError::Forbidden {
                reason: "You are not allowed to create events for this audience".into(),
            });
        }

        let attendee_ids = self
            .resolve_attendees(caller.organization_id, &params)
            .await?;
        if attendee_ids.is_empty() {
            return Err(ServiceError::Validation {
                field: "audience".into(),
                message: "At least one attendee is required".into(),
            });
        }

        let duration_minutes = (params.ends_at - params.starts_at).num_minutes() as i32;
        let now = Utc::now();
        let series = EventSeries {
            id: EventSeriesId::new(),
            organization_id: caller.organization_id,
            created_by: caller_id,
            title: params.title.trim().to_string(),
            description: params.description.clone(),
            event_type: params.event_type,
            audience_type: params.audience_type,
            team_id: params.team_id,
            project_id: params.project_id,
            location: params.location.clone(),
            meeting_url: params.meeting_url.clone(),
            timezone: params.timezone.clone(),
            duration_minutes,
            recurrence_kind: params.recurrence_kind,
            interval_days: params.interval_days,
            recurrence_end_at: params.recurrence_end_at,
            status: EventSeriesStatus::Active,
            created_at: now,
            updated_at: now,
        };

        let series = self.event_repo.create_series(series).await?;
        let occurrences = generate_occurrences(&series, params.starts_at, params.ends_at);
        self.event_repo.create_occurrences(&occurrences).await?;
        self.event_repo
            .add_attendees(series.id, &attendee_ids)
            .await?;

        let body = format_scheduled_body(&series, params.starts_at);
        for uid in &attendee_ids {
            if *uid == caller_id {
                continue;
            }
            self.notification_service
                .notify_event_scheduled(
                    *uid,
                    series.organization_id,
                    series.title.clone(),
                    body.clone(),
                    Some(format!("/events/{}", occurrences[0].id)),
                    serde_json::json!({
                        "eventSeriesId": series.id.to_string(),
                        "eventOccurrenceId": occurrences[0].id.to_string(),
                        "eventType": series.event_type.as_str(),
                        "startsAt": params.starts_at.to_rfc3339(),
                        "timezone": series.timezone,
                        "reoccurrenceKind": series.recurrence_kind.as_str(),
                    }),
                )
                .await?;
        }

        Ok(EventOccurrenceView {
            occurrence: occurrences[0].clone(),
            series,
        })
    }

    pub async fn list_events(
        &self,
        caller: &OrgMembership,
        caller_id: UserId,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
        limit: u64,
    ) -> Result<Vec<EventOccurrenceView>, ServiceError> {
        let rows = self
            .event_repo
            .list_occurrences_for_user(caller.organization_id, caller_id, from, to, limit)
            .await?;
        Ok(rows
            .into_iter()
            .map(|(occurrence, series)| EventOccurrenceView { occurrence, series })
            .collect())
    }

    pub async fn upcoming_for_user(
        &self,
        org_id: OrganizationId,
        user_id: UserId,
        days: i64,
        limit: u64,
    ) -> Result<Vec<EventOccurrenceView>, ServiceError> {
        let from = Utc::now();
        let to = from + Duration::days(days);
        let rows = self
            .event_repo
            .list_upcoming_events_for_user(org_id, user_id, from, to, limit)
            .await?;
        Ok(rows
            .into_iter()
            .map(|(occurrence, series)| EventOccurrenceView { occurrence, series })
            .collect())
    }

    pub async fn get_occurrence(
        &self,
        caller: &OrgMembership,
        caller_id: UserId,
        occurrence_id: EventOccurrenceId,
    ) -> Result<EventOccurrenceView, ServiceError> {
        let occurrence = self
            .event_repo
            .find_occurrence_by_id(occurrence_id)
            .await?
            .ok_or_else(|| ServiceError::EventNotFound {
                id: occurrence_id.to_string(),
            })?;
        if occurrence.organization_id != caller.organization_id {
            return Err(ServiceError::EventNotFound {
                id: occurrence_id.to_string(),
            });
        }
        let attendees = self
            .event_repo
            .list_attendee_ids(occurrence.series_id)
            .await?;
        if !attendees.contains(&caller_id) && !caller.role.at_least(OrgRole::OrgAdmin) {
            return Err(ServiceError::Forbidden {
                reason: "not an attendee of this event".into(),
            });
        }
        let series = self
            .event_repo
            .find_series_by_id(occurrence.series_id)
            .await?
            .ok_or_else(|| ServiceError::EventNotFound {
                id: occurrence_id.to_string(),
            })?;
        Ok(EventOccurrenceView { occurrence, series })
    }
    pub async fn cancel_occurrence(
        &self,
        caller: &OrgMembership,
        caller_id: UserId,
        occurrence_id: EventOccurrenceId,
    ) -> Result<(), ServiceError> {
        let view = self
            .get_occurrence(caller, caller_id, occurrence_id)
            .await?;
        self.require_can_manage(caller, caller_id, &view.series)
            .await?;
        self.event_repo.cancel_occurrence(occurrence_id).await?;
        self.notify_attendees_cancelled(&view.series, Some(occurrence_id))
            .await?;
        Ok(())
    }
    pub async fn cancel_series(
        &self,
        caller: &OrgMembership,
        caller_id: UserId,
        series_id: EventSeriesId,
    ) -> Result<(), ServiceError> {
        let series = self
            .event_repo
            .find_series_by_id(series_id)
            .await?
            .ok_or_else(|| ServiceError::EventNotFound {
                id: series_id.to_string(),
            })?;
        if series.organization_id != caller.organization_id {
            return Err(ServiceError::EventNotFound {
                id: series_id.to_string(),
            });
        }
        self.require_can_manage(caller, caller_id, &series).await?;
        self.event_repo.cancel_series(series_id).await?;
        self.notify_attendees_cancelled(&series, None).await?;
        Ok(())
    }

    async fn resolve_attendees(
        &self,
        org_id: OrganizationId,
        params: &CreateEventParams,
    ) -> Result<Vec<UserId>, ServiceError> {
        let mut set = HashSet::new();
        match params.audience_type {
            EventAudienceType::Organization => {
                for m in self.org_membership_repo.list_by_org(org_id).await? {
                    set.insert(m.user_id);
                }
            }
            EventAudienceType::Team => {
                let team_id = params.team_id.ok_or_else(|| ServiceError::Validation {
                    field: "teamId".into(),
                    message: "Team ID is required".into(),
                })?;
                require_team_in_org(&self.team_repo, team_id, org_id).await?;
                for m in self.team_repo.list_members(team_id).await? {
                    set.insert(m.user_id);
                }
            }
            EventAudienceType::Project => {
                let project_id = params.project_id.ok_or_else(|| ServiceError::Validation {
                    field: "projectId".into(),
                    message: "Project ID is required for project audience".into(),
                })?;
                let project = self
                    .project_repo
                    .find_by_id(project_id)
                    .await?
                    .ok_or_else(|| ServiceError::ProjectNotFound {
                        id: project_id.to_string(),
                    })?;
                if project.organization_id != org_id {
                    return Err(ServiceError::ProjectNotFound {
                        id: project_id.to_string(),
                    });
                }
                for m in self.project_repo.list_members(project_id).await? {
                    set.insert(m.user_id);
                }
            }
            EventAudienceType::Custom => {
                if params.custom_user_ids.is_empty() {
                    return Err(ServiceError::Validation {
                        field: "customUserIds".into(),
                        message: "At least one user is required for CUSTOM audience".into(),
                    });
                }
                let members = self.org_membership_repo.list_by_org(org_id).await?;
                let member_ids: HashSet<_> = members.into_iter().map(|m| m.user_id).collect();
                for uid in &params.custom_user_ids {
                    if !member_ids.contains(uid) {
                        return Err(ServiceError::Validation {
                            field: "customUserIds".into(),
                            message: format!("User {} is not a member of the organization", uid),
                        });
                    }
                    set.insert(*uid);
                }
            }
        }
        Ok(set.into_iter().collect())
    }

    fn validate_create(&self, params: &CreateEventParams) -> Result<(), ServiceError> {
        if params.title.trim().is_empty() {
            return Err(ServiceError::Validation {
                field: "title".into(),
                message: "Title is required".into(),
            });
        }
        if params.ends_at <= params.starts_at {
            return Err(ServiceError::Validation {
                field: "endsAt".into(),
                message: "Ends at must be after starts at".into(),
            });
        }
        if params.timezone.trim().is_empty() {
            return Err(ServiceError::Validation {
                field: "timezone".into(),
                message: "Timezone is required".into(),
            });
        }

        match params.recurrence_kind {
            RecurrenceKind::IntervalDays => {
                let n = params.interval_days.unwrap_or(0);
                if n < 1 {
                    return Err(ServiceError::Validation {
                        field: "intervalDays".into(),
                        message: "Interval days must be at least 1".into(),
                    });
                }
            }
            RecurrenceKind::None
            | RecurrenceKind::Daily
            | RecurrenceKind::Weekly
            | RecurrenceKind::Monthly
            | RecurrenceKind::Yearly => {}
        }
        Ok(())
    }

    async fn build_create_context(
        &self,
        caller: &OrgMembership,
        caller_id: UserId,
        params: &CreateEventParams,
    ) -> Result<EffectiveContext, ServiceError> {
        match params.audience_type {
            EventAudienceType::Organization | EventAudienceType::Custom => Ok(org_context(caller)),
            EventAudienceType::Team => {
                let team_id = params.team_id.ok_or_else(|| ServiceError::Validation {
                    field: "teamId".into(),
                    message: "Team ID is required".into(),
                })?;
                require_team_in_org(&self.team_repo, team_id, caller.organization_id).await?;
                load_team_context(caller, &self.team_repo, team_id, caller_id).await
            }
            EventAudienceType::Project => {
                let project_id = params.project_id.ok_or_else(|| ServiceError::Validation {
                    field: "projectId".into(),
                    message: "Project ID is required".into(),
                })?;
                let (ctx, _) = load_project_context(
                    caller,
                    &self.team_repo,
                    &self.project_repo,
                    project_id,
                    caller_id,
                )
                .await?;
                Ok(ctx)
            }
        }
    }

    async fn require_can_manage(
        &self,
        caller: &OrgMembership,
        caller_id: UserId,
        series: &EventSeries,
    ) -> Result<(), ServiceError> {
        if caller.role.at_least(OrgRole::OrgAdmin) || series.created_by == caller_id {
            return Ok(());
        }
        match series.audience_type {
            EventAudienceType::Team => {
                if let Some(team_id) = series.team_id {
                    let ctx =
                        load_team_context(caller, &self.team_repo, team_id, caller_id).await?;
                    if can_create_event(&ctx, EventAudienceType::Team) {
                        return Ok(());
                    }
                }
            }
            EventAudienceType::Project => {
                if let Some(project_id) = series.project_id {
                    let (ctx, _) = load_project_context(
                        caller,
                        &self.team_repo,
                        &self.project_repo,
                        project_id,
                        caller_id,
                    )
                    .await?;
                    if can_create_event(&ctx, EventAudienceType::Project) {
                        return Ok(());
                    }
                }
            }
            _ => {}
        }
        Err(ServiceError::Forbidden {
            reason: "You are not allowed to manage this event".into(),
        })
    }

    async fn notify_attendees_cancelled(
        &self,
        series: &EventSeries,
        occurrence_id: Option<EventOccurrenceId>,
    ) -> Result<(), ServiceError> {
        let attendees = self.event_repo.list_attendee_ids(series.id).await?;
        let body = if occurrence_id.is_some() {
            format!("{} (one occurrence) was cancelled", series.title)
        } else {
            format!("{} (all occurrences) was cancelled", series.title)
        };
        for uid in attendees {
            self.notification_service
                .notify_event_cancelled(
                    uid,
                    series.organization_id,
                    series.title.clone(),
                    body.clone(),
                    Some(format!("/events/{}", occurrence_id.unwrap())),
                    serde_json::json!({
                        "eventSeriesId": series.id.to_string(),
                        "eventOccurrenceId": occurrence_id.map(|id| id.to_string()),
                    }),
                )
                .await?;
        }
        Ok(())
    }
}

fn can_create_event(ctx: &EffectiveContext, audience: EventAudienceType) -> bool {
    let org = ctx.org.role;
    match audience {
        EventAudienceType::Organization | EventAudienceType::Custom => {
            org.at_least(OrgRole::OrgAdmin)
        }
        EventAudienceType::Team => {
            org.at_least(OrgRole::OrgAdmin)
                || ctx
                    .team
                    .as_ref()
                    .is_some_and(|t| t.role.at_least(TeamRole::Admin))
        }
        EventAudienceType::Project => {
            org.at_least(OrgRole::OrgAdmin)
                || effective_project_role(ctx.team.as_ref(), ctx.project.as_ref())
                    .is_some_and(|r| r.at_least(ProjectRole::Admin))
        }
    }
}

fn generate_occurrences(
    series: &EventSeries,
    first_start: DateTime<Utc>,
    first_end: DateTime<Utc>,
) -> Vec<EventOccurrence> {
    let duration = first_end - first_start;
    let horizon = first_start + Duration::days(OCCURRENCE_HORIZON_DAYS);
    let hard_end = series.recurrence_end_at.unwrap_or(horizon);

    let step = match series.recurrence_kind {
        RecurrenceKind::None => return vec![make_occ(series, first_start, first_end)],
        RecurrenceKind::Daily => Duration::days(1),
        RecurrenceKind::Weekly => Duration::weeks(1),
        RecurrenceKind::Monthly => Duration::days(30),
        // TODO: Implement yearly recurrence for leap years handling
        RecurrenceKind::Yearly => Duration::days(365),
        RecurrenceKind::IntervalDays => Duration::days(series.interval_days.unwrap_or(1) as i64),
    };

    let mut out = Vec::new();
    let mut start = first_start;
    while start < hard_end {
        out.push(make_occ(series, start, start + duration));
        start += step;
    }
    out
}

fn make_occ(
    series: &EventSeries,
    starts_at: DateTime<Utc>,
    ends_at: DateTime<Utc>,
) -> EventOccurrence {
    let now = Utc::now();
    EventOccurrence {
        id: EventOccurrenceId::new(),
        series_id: series.id,
        organization_id: series.organization_id,
        starts_at,
        ends_at,
        status: EventOccurrenceStatus::Scheduled,
        reminded_24h_at: None,
        reminded_15m_at: None,
        created_at: now,
        updated_at: now,
    }
}

fn format_scheduled_body(series: &EventSeries, starts_at: DateTime<Utc>) -> String {
    let reoccurrence = match series.recurrence_kind {
        RecurrenceKind::None => "one-time".to_string(),
        RecurrenceKind::Daily => "daily".into(),
        RecurrenceKind::Weekly => "weekly".into(),
        RecurrenceKind::Monthly => "monthly".into(),
        RecurrenceKind::Yearly => "yearly".into(),
        RecurrenceKind::IntervalDays => {
            format!("every {} days", series.interval_days.unwrap_or(1))
        }
    };
    format!(
        "{} · starts {} ({}) · {}",
        series.event_type.as_str(),
        starts_at.to_rfc3339(),
        series.timezone,
        reoccurrence
    )
}

#[derive(Debug, Clone)]
pub enum TaskEvent {
    Updated {
        project_id: ProjectId,
        task: Task,
    },
    Created {
        project_id: ProjectId,
        task: Task,
    },
    Deleted {
        project_id: ProjectId,
        task_id: TaskId,
    },
}

impl TaskEvent {
    pub fn project_id(&self) -> ProjectId {
        match self {
            TaskEvent::Updated { project_id, .. } => *project_id,
            TaskEvent::Created { project_id, .. } => *project_id,
            TaskEvent::Deleted { project_id, .. } => *project_id,
        }
    }
}
