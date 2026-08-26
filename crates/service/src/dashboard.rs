use std::sync::Arc;

use chrono::{DateTime, Duration, NaiveDate, Utc};
use devboard_domain::{
    AttentionItem, AttentionKind, CompletionPoint, DashboardCta, DashboardEmptyState,
    DashboardTaskItem, MyDashboard, MyDashboardProject, MyDashboardStats, OrgDashboard,
    OrgDashboardStats, OrgMembership, OrgRole, TaskPriority, TaskStatus, UserId, WorkloadPoint,
};
use devboard_repository::{
    InvitationRepository, OrganizationRepository, ProjectRepository, TaskRepository,
    UserRepository,
    task::{CompletionDayRow, DashboardTaskRow},
};

use crate::{ProjectService, ServiceError};

const TREND_DAYS: i64 = 14;
const MY_TASKS_LIMIT: usize = 10;
const RISK_TASKS_LIMIT: usize = 8;

pub struct DashboardService {
    user_repo: Arc<dyn UserRepository>,
    org_repo: Arc<dyn OrganizationRepository>,
    project_repo: Arc<dyn ProjectRepository>,
    task_repo: Arc<dyn TaskRepository>,
    invitation_repo: Arc<dyn InvitationRepository>,
    project_service: Arc<ProjectService>,
}

impl DashboardService {
    pub fn new(
        user_repo: Arc<dyn UserRepository>,
        org_repo: Arc<dyn OrganizationRepository>,
        project_repo: Arc<dyn ProjectRepository>,
        task_repo: Arc<dyn TaskRepository>,
        invitation_repo: Arc<dyn InvitationRepository>,
        project_service: Arc<ProjectService>,
    ) -> Self {
        Self {
            user_repo,
            org_repo,
            project_repo,
            task_repo,
            invitation_repo,
            project_service,
        }
    }

    pub async fn my_dashboard(
        &self,
        caller_id: UserId,
        membership: OrgMembership,
    ) -> Result<MyDashboard, ServiceError> {
        let org_id = membership.organization_id;
        let can_manage = membership.role.at_least(OrgRole::OrgAdmin);

        let (user, org) = tokio::try_join!(
            self.user_repo.find_by_id(caller_id),
            self.org_repo.find_by_id(org_id),
        )?;
        let user = user.ok_or(ServiceError::Unauthenticated)?;
        let org = org.ok_or(ServiceError::Internal("Organization not found".into()))?;

        let projects = self
            .project_service
            .list_projects(org_id, caller_id)
            .await?;
        let project_ids: Vec<_> = projects.iter().map(|p| p.id).collect();

        let rows = self.task_repo.list_for_dashboard(&project_ids).await?;
        let now = Utc::now();
        let week_end = now + Duration::days(7);

        let is_open = |s: TaskStatus| !matches!(s, TaskStatus::Done | TaskStatus::Cancelled);

        let mine: Vec<&DashboardTaskRow> = rows
            .iter()
            .filter(|r| r.task.assignee_id == Some(caller_id) && is_open(r.task.status))
            .collect();

        let stats = MyDashboardStats {
            assigned_to_me: mine.len() as i64,
            due_this_week: mine
                .iter()
                .filter(|r| r.task.due_date.is_some_and(|d| d >= now && d <= week_end))
                .count() as i64,
            overdue: mine
                .iter()
                .filter(|r| r.task.due_date.is_some_and(|d| d < now))
                .count() as i64,
            in_progress: mine
                .iter()
                .filter(|r| matches!(r.task.status, TaskStatus::InProgress | TaskStatus::InReview))
                .count() as i64,
        };

        let mut my_tasks: Vec<DashboardTaskItem> =
            mine.iter().map(|r| to_task_item(r, now)).collect();
        my_tasks.sort_by(|a, b| {
            b.is_overdue
                .cmp(&a.is_overdue)
                .then(a.due_date.cmp(&b.due_date))
        });
        my_tasks.truncate(MY_TASKS_LIMIT);

        let my_projects = projects
            .iter()
            .map(|p| MyDashboardProject {
                id: p.id,
                name: p.name.clone(),
                key: p.key.clone(),
                open_tasks: rows
                    .iter()
                    .filter(|r| r.task.project_id == p.id && is_open(r.task.status))
                    .count() as i64,
                my_open_tasks: rows
                    .iter()
                    .filter(|r| {
                        r.task.project_id == p.id
                            && is_open(r.task.status)
                            && r.task.assignee_id == Some(caller_id)
                    })
                    .count() as i64,
            })
            .collect::<Vec<_>>();

        let from = (now - Duration::days(TREND_DAYS - 1))
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();
        let raw_trend = self
            .task_repo
            .completion_by_day(&project_ids, Some(caller_id), from, now + Duration::days(1))
            .await?;
        let completion_trend = fill_trend(raw_trend, now.date_naive(), TREND_DAYS);

        let empty_state = DashboardEmptyState {
            has_projects: !projects.is_empty(),
            has_tasks: !rows.is_empty(),
            has_assigned_tasks: stats.assigned_to_me > 0,
            primary_cta: if projects.is_empty() {
                if can_manage {
                    DashboardCta::CreateProject
                } else {
                    DashboardCta::Explore
                }
            } else if stats.assigned_to_me == 0 {
                DashboardCta::CreateTask
            } else {
                DashboardCta::Explore
            },
        };

        Ok(MyDashboard {
            greeting_name: user.display_name,
            organization_name: org.name,
            empty_state,
            stats,
            my_tasks,
            my_projects,
            upcoming_events: vec![],
            completion_trend,
        })
    }

    pub async fn org_dashboard(
        &self,
        caller_id: UserId,
        membership: OrgMembership,
    ) -> Result<OrgDashboard, ServiceError> {
        if !membership.role.at_least(OrgRole::OrgAdmin) {
            return Err(ServiceError::Forbidden {
                reason: "org dashboard requires OrgAdmin or OrgOwner role".into(),
            });
        }

        let org_id = membership.organization_id;
        let (user, org) = tokio::try_join!(
            self.user_repo.find_by_id(caller_id),
            self.org_repo.find_by_id(org_id),
        )?;
        let user = user.ok_or(ServiceError::Unauthenticated)?;
        let org = org.ok_or(ServiceError::Internal("Organization not found".into()))?;

        let projects = self.project_repo.find_by_organization(org_id).await?;
        let project_ids: Vec<_> = projects.iter().map(|p| p.id).collect();

        let rows = self.task_repo.list_for_dashboard(&project_ids).await?;
        let now = Utc::now();
        let week_ago = now - Duration::days(7);

        let is_open = |s: TaskStatus| !matches!(s, TaskStatus::Done | TaskStatus::Cancelled);
        let open: Vec<_> = rows.iter().filter(|r| is_open(r.task.status)).collect();

        let overdue = open
            .iter()
            .filter(|r| r.task.due_date.is_some_and(|d| d < now))
            .count() as i64;

        let unassigned = open.iter().filter(|r| r.task.assignee_id.is_none()).count() as i64;

        let unassigned_urgent = open
            .iter()
            .filter(|r| {
                r.task.assignee_id.is_none() && matches!(r.task.priority, TaskPriority::Urgent)
            })
            .count() as i64;

        let moved_this_week = open
            .iter()
            .filter(|r| r.task.updated_at >= week_ago)
            .count() as i64;

        let pending_invites = self
            .invitation_repo
            .list_pending_by_org(org_id)
            .await?
            .len() as i64;

        let mut risk_tasks: Vec<_> = open
            .iter()
            .filter(|r| {
                r.task
                    .due_date
                    .is_some_and(|d| d <= now + Duration::days(3))
            })
            .map(|r| to_task_item(r, now))
            .collect();
        risk_tasks.sort_by(|a, b| {
            b.is_overdue
                .cmp(&a.is_overdue)
                .then(a.due_date.cmp(&b.due_date))
        });
        risk_tasks.truncate(RISK_TASKS_LIMIT);

        let mut attention = Vec::new();
        if unassigned_urgent > 0 {
            attention.push(AttentionItem {
                id: "unassigned-urgent".into(),
                kind: AttentionKind::UnassignedUrgent,
                title: "High-priority unassigned tasks".into(),
                description: format!("{unassigned_urgent} critical task(s) waiting for an owner"),
                action_label: "Assign".into(),
                count: unassigned_urgent,
                href: Some("/projects".into()),
            });
        }
        let stale_review = open
            .iter()
            .filter(|r| {
                matches!(r.task.status, TaskStatus::InReview)
                    && now - r.task.updated_at > Duration::days(3)
            })
            .count() as i64;
        if stale_review > 0 {
            attention.push(AttentionItem {
                id: "stale-in-review".into(),
                kind: AttentionKind::StaleInReview,
                title: "Stale reviews".into(),
                description: format!("{stale_review} review(s) waiting for an update"),
                action_label: "Review".into(),
                count: stale_review,
                href: Some("/projects".into()),
            });
        }
        if pending_invites > 0 {
            attention.push(AttentionItem {
                id: "pending-invites".into(),
                kind: AttentionKind::PendingInvites,
                title: "Pending invites".into(),
                description: format!("{pending_invites} invite(s) waiting for acceptance"),
                action_label: "Manage invites".into(),
                count: pending_invites,
                href: Some("/settings".into()),
            });
        }

        let workload_by_team = self
            .task_repo
            .workload_by_team(&project_ids)
            .await?
            .into_iter()
            .map(|w| WorkloadPoint {
                team: w.team_name,
                todo: w.todo,
                in_progress: w.in_progress,
                done: w.done,
            })
            .collect();

        let from = (now - Duration::days(TREND_DAYS - 1))
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();
        let raw_trend = self
            .task_repo
            .completion_by_day(&project_ids, None, from, now + Duration::days(1))
            .await?;
        let completion_trend = fill_trend(raw_trend, now.date_naive(), TREND_DAYS);

        let empty_state = DashboardEmptyState {
            has_projects: !projects.is_empty(),
            has_tasks: !rows.is_empty(),
            has_assigned_tasks: rows.iter().any(|r| r.task.assignee_id.is_some()),
            primary_cta: if projects.is_empty() {
                DashboardCta::CreateProject
            } else if pending_invites == 0 && rows.is_empty() {
                DashboardCta::InviteMember
            } else {
                DashboardCta::Explore
            },
        };

        Ok(OrgDashboard {
            greeting_name: user.display_name,
            organization_name: org.name,
            empty_state,
            stats: OrgDashboardStats {
                overdue,
                unassigned,
                unassigned_urgent,
                pending_invites,
                open_tasks: open.len() as i64,
                moved_this_week,
            },
            risk_tasks,
            attention,
            workload_by_team,
            completion_trend,
        })
    }
}

fn to_task_item(row: &DashboardTaskRow, now: DateTime<Utc>) -> DashboardTaskItem {
    let is_overdue = row.task.due_date.is_some_and(|d| d < now)
        && !matches!(row.task.status, TaskStatus::Done | TaskStatus::Cancelled);

    DashboardTaskItem {
        id: row.task.id,
        project_id: row.task.project_id,
        key: row.task.display_key(&row.project_key),
        title: row.task.title.clone(),
        status: row.task.status,
        priority: row.task.priority,
        due_date: row.task.due_date,
        is_overdue,
    }
}

fn fill_trend(raw: Vec<CompletionDayRow>, today: NaiveDate, days: i64) -> Vec<CompletionPoint> {
    use std::collections::HashMap;

    let map: HashMap<_, _> = raw.into_iter().map(|r| (r.day, r.completed)).collect();
    let start = today - Duration::days(days - 1);
    (0..days)
        .map(|i| {
            let day = start + Duration::days(i);
            CompletionPoint {
                day,
                completed: map.get(&day).copied().unwrap_or(0),
            }
        })
        .collect()
}
