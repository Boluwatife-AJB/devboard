use async_graphql::{Enum, ID, Object};
use chrono::{DateTime, Utc};
use devboard_domain::{
    AttentionItem, AttentionKind, CompletionPoint, DashboardCta, DashboardEmptyState,
    DashboardEvent, DashboardTaskItem, MyDashboard, MyDashboardProject, MyDashboardStats,
    OrgDashboard, OrgDashboardStats, WorkloadPoint,
};

use crate::types::{GqlTaskPriority, GqlTaskStatus};

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlDashboardCta {
    CreateProject,
    InviteMember,
    CreateTask,
    Explore,
}

impl From<DashboardCta> for GqlDashboardCta {
    fn from(c: DashboardCta) -> Self {
        match c {
            DashboardCta::CreateProject => Self::CreateProject,
            DashboardCta::InviteMember => Self::InviteMember,
            DashboardCta::CreateTask => Self::CreateTask,
            DashboardCta::Explore => Self::Explore,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlAttentionKind {
    UnassignedUrgent,
    StaleInReview,
    PendingInvites,
}

impl From<AttentionKind> for GqlAttentionKind {
    fn from(k: AttentionKind) -> Self {
        match k {
            AttentionKind::UnassignedUrgent => Self::UnassignedUrgent,
            AttentionKind::StaleInReview => Self::StaleInReview,
            AttentionKind::PendingInvites => Self::PendingInvites,
        }
    }
}

#[derive(Clone)]
pub struct GqlDashboardEmptyState {
    pub inner: DashboardEmptyState,
}

#[Object]
impl GqlDashboardEmptyState {
    async fn has_projects(&self) -> bool {
        self.inner.has_projects
    }
    async fn has_tasks(&self) -> bool {
        self.inner.has_tasks
    }
    async fn has_assigned_tasks(&self) -> bool {
        self.inner.has_assigned_tasks
    }
    async fn primary_cta(&self) -> GqlDashboardCta {
        GqlDashboardCta::from(self.inner.primary_cta)
    }
}

#[derive(Clone)]
pub struct GqlDashboardTaskItem {
    pub inner: DashboardTaskItem,
}

#[Object]
impl GqlDashboardTaskItem {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }
    async fn project_id(&self) -> ID {
        ID(self.inner.project_id.to_string())
    }
    async fn key(&self) -> &str {
        &self.inner.key
    }
    async fn title(&self) -> &str {
        &self.inner.title
    }
    async fn status(&self) -> GqlTaskStatus {
        GqlTaskStatus::from(self.inner.status)
    }
    async fn priority(&self) -> GqlTaskPriority {
        GqlTaskPriority::from(self.inner.priority)
    }
    async fn due_date(&self) -> Option<DateTime<Utc>> {
        self.inner.due_date
    }
    async fn is_overdue(&self) -> bool {
        self.inner.is_overdue
    }
}

#[derive(Clone)]
pub struct GqlCompletionPoint {
    pub inner: CompletionPoint,
}

#[Object]
impl GqlCompletionPoint {
    async fn day(&self) -> String {
        self.inner.day.to_string()
    }
    async fn completed(&self) -> i64 {
        self.inner.completed
    }
}

#[derive(Clone)]
pub struct GqlMyDashboardStats {
    pub inner: MyDashboardStats,
}

#[Object]
impl GqlMyDashboardStats {
    async fn overdue_tasks(&self) -> i64 {
        self.inner.overdue
    }
    async fn tasks_due_this_week(&self) -> i64 {
        self.inner.due_this_week
    }
    async fn tasks_assigned_to_me(&self) -> i64 {
        self.inner.assigned_to_me
    }
    async fn tasks_in_progress(&self) -> i64 {
        self.inner.in_progress
    }
}

#[derive(Clone)]
pub struct GqlOrgDashboardStats {
    pub inner: OrgDashboardStats,
}

#[Object]
impl GqlOrgDashboardStats {
    async fn overdue_tasks(&self) -> i64 {
        self.inner.overdue
    }
    async fn unassigned_tasks(&self) -> i64 {
        self.inner.unassigned
    }
    async fn unassigned_urgent_tasks(&self) -> i64 {
        self.inner.unassigned_urgent
    }
    async fn pending_invites(&self) -> i64 {
        self.inner.pending_invites
    }
    async fn open_tasks(&self) -> i64 {
        self.inner.open_tasks
    }
    async fn moved_this_week(&self) -> i64 {
        self.inner.moved_this_week
    }
}

#[derive(Clone)]
pub struct GqlMyDashboardProject {
    pub inner: MyDashboardProject,
}

#[Object]
impl GqlMyDashboardProject {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }
    async fn name(&self) -> &str {
        &self.inner.name
    }
    async fn key(&self) -> &str {
        &self.inner.key
    }
    async fn open_tasks(&self) -> i64 {
        self.inner.open_tasks
    }
    async fn my_open_tasks(&self) -> i64 {
        self.inner.my_open_tasks
    }
}

#[derive(Clone)]
pub struct GqlDashboardEvent {
    pub inner: DashboardEvent,
}

#[Object]
impl GqlDashboardEvent {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }
    async fn title(&self) -> &str {
        &self.inner.title
    }
    async fn starts_at(&self) -> DateTime<Utc> {
        self.inner.starts_at
    }
}

#[derive(Clone)]
pub struct GqlWorkloadPoint {
    pub inner: WorkloadPoint,
}

#[Object]
impl GqlWorkloadPoint {
    async fn team(&self) -> &str {
        &self.inner.team
    }
    async fn todo(&self) -> i64 {
        self.inner.todo
    }
    async fn in_progress(&self) -> i64 {
        self.inner.in_progress
    }
    async fn done(&self) -> i64 {
        self.inner.done
    }
}

#[derive(Clone)]
pub struct GqlAttentionItem {
    pub inner: AttentionItem,
}

#[Object]
impl GqlAttentionItem {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }
    async fn kind(&self) -> GqlAttentionKind {
        GqlAttentionKind::from(self.inner.kind)
    }
    async fn title(&self) -> &str {
        &self.inner.title
    }
    async fn description(&self) -> &str {
        &self.inner.description
    }
    async fn action_label(&self) -> &str {
        &self.inner.action_label
    }
    async fn href(&self) -> Option<&str> {
        self.inner.href.as_deref()
    }
    async fn count(&self) -> i64 {
        self.inner.count
    }
}

#[derive(Clone)]
pub struct GqlMyDashboard {
    pub inner: MyDashboard,
}

impl From<MyDashboard> for GqlMyDashboard {
    fn from(inner: MyDashboard) -> Self {
        GqlMyDashboard { inner }
    }
}

#[Object]
impl GqlMyDashboard {
    async fn greeting_name(&self) -> &str {
        &self.inner.greeting_name
    }
    async fn organization_name(&self) -> &str {
        &self.inner.organization_name
    }
    async fn empty_state(&self) -> GqlDashboardEmptyState {
        GqlDashboardEmptyState {
            inner: self.inner.empty_state.clone(),
        }
    }
    async fn stats(&self) -> GqlMyDashboardStats {
        GqlMyDashboardStats {
            inner: self.inner.stats.clone(),
        }
    }
    async fn my_tasks(&self) -> Vec<GqlDashboardTaskItem> {
        self.inner
            .my_tasks
            .iter()
            .cloned()
            .map(|t| GqlDashboardTaskItem { inner: t })
            .collect()
    }
    async fn my_projects(&self) -> Vec<GqlMyDashboardProject> {
        self.inner
            .my_projects
            .iter()
            .cloned()
            .map(|p| GqlMyDashboardProject { inner: p })
            .collect()
    }
    async fn upcoming_events(&self) -> Vec<GqlDashboardEvent> {
        self.inner
            .upcoming_events
            .iter()
            .cloned()
            .map(|e| GqlDashboardEvent { inner: e })
            .collect()
    }
    async fn completion_trend(&self) -> Vec<GqlCompletionPoint> {
        self.inner
            .completion_trend
            .iter()
            .cloned()
            .map(|c| GqlCompletionPoint { inner: c })
            .collect()
    }
}

#[derive(Clone)]
pub struct GqlOrgDashboard {
    pub inner: OrgDashboard,
}

impl From<OrgDashboard> for GqlOrgDashboard {
    fn from(inner: OrgDashboard) -> Self {
        GqlOrgDashboard { inner }
    }
}

#[Object]
impl GqlOrgDashboard {
    async fn greeting_name(&self) -> &str {
        &self.inner.greeting_name
    }
    async fn organization_name(&self) -> &str {
        &self.inner.organization_name
    }
    async fn empty_state(&self) -> GqlDashboardEmptyState {
        GqlDashboardEmptyState {
            inner: self.inner.empty_state.clone(),
        }
    }
    async fn stats(&self) -> GqlOrgDashboardStats {
        GqlOrgDashboardStats {
            inner: self.inner.stats.clone(),
        }
    }
    async fn risk_tasks(&self) -> Vec<GqlDashboardTaskItem> {
        self.inner
            .risk_tasks
            .iter()
            .cloned()
            .map(|t| GqlDashboardTaskItem { inner: t })
            .collect()
    }
    async fn attention(&self) -> Vec<GqlAttentionItem> {
        self.inner
            .attention
            .iter()
            .cloned()
            .map(|a| GqlAttentionItem { inner: a })
            .collect()
    }
    async fn workload_by_team(&self) -> Vec<GqlWorkloadPoint> {
        self.inner
            .workload_by_team
            .iter()
            .cloned()
            .map(|w| GqlWorkloadPoint { inner: w })
            .collect()
    }
    async fn completion_trend(&self) -> Vec<GqlCompletionPoint> {
        self.inner
            .completion_trend
            .iter()
            .cloned()
            .map(|c| GqlCompletionPoint { inner: c })
            .collect()
    }
}
