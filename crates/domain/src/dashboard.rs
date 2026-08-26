use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

use crate::{ProjectId, TaskId, TaskPriority, TaskStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyDashboard {
    pub greeting_name: String,
    pub organization_name: String,
    pub empty_state: DashboardEmptyState,
    pub stats: MyDashboardStats,
    pub my_tasks: Vec<DashboardTaskItem>,
    pub my_projects: Vec<MyDashboardProject>,
    pub upcoming_events: Vec<DashboardEvent>,
    pub completion_trend: Vec<CompletionPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgDashboard {
    pub greeting_name: String,
    pub organization_name: String,
    pub empty_state: DashboardEmptyState,
    pub stats: OrgDashboardStats,
    pub risk_tasks: Vec<DashboardTaskItem>,
    pub attention: Vec<AttentionItem>,
    pub workload_by_team: Vec<WorkloadPoint>,
    pub completion_trend: Vec<CompletionPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardEmptyState {
    pub has_projects: bool,
    pub has_tasks: bool,
    pub has_assigned_tasks: bool,
    pub primary_cta: DashboardCta,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DashboardCta {
    CreateProject,
    InviteMember,
    CreateTask,
    Explore,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyDashboardStats {
    pub assigned_to_me: i64,
    pub due_this_week: i64,
    pub overdue: i64,
    pub in_progress: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgDashboardStats {
    pub overdue: i64,
    pub unassigned: i64,
    pub unassigned_urgent: i64,
    pub pending_invites: i64,
    pub open_tasks: i64,
    pub moved_this_week: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardTaskItem {
    pub id: TaskId,
    pub project_id: ProjectId,
    pub key: String,
    pub title: String,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub due_date: Option<DateTime<Utc>>,
    pub is_overdue: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyDashboardProject {
    pub id: ProjectId,
    pub name: String,
    pub key: String,
    pub open_tasks: i64,
    pub my_open_tasks: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardEvent {
    pub id: String,
    pub title: String,
    pub starts_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionPoint {
    pub day: NaiveDate,
    pub completed: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkloadPoint {
    pub team: String,
    pub todo: i64,
    pub in_progress: i64,
    pub done: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttentionItem {
    pub id: String,
    pub kind: AttentionKind,
    pub title: String,
    pub description: String,
    pub action_label: String,
    pub href: Option<String>,
    pub count: i64,
}

#[derive(Debug, Clone, Eq, PartialEq, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AttentionKind {
    UnassignedUrgent,
    StaleInReview,
    PendingInvites,
}
