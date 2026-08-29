use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

use crate::{ProjectId, TaskId, TaskPriority, TaskStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyDashboard {
    pub greeting_name: String,
    pub organization_name: String,
    pub empty_state: DashboardEmptyState,
    pub setup_progress: DashboardSetupProgress,
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
    pub setup_progress: DashboardSetupProgress,
    pub stats: OrgDashboardStats,
    pub risk_tasks: Vec<DashboardTaskItem>,
    pub attention: Vec<AttentionItem>,
    pub workload_by_team: Vec<WorkloadPoint>,
    pub completion_trend: Vec<CompletionPoint>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SetupPersona {
    OrgAdmin,
    OrgMember,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SetupStepId {
    CreateTeam,
    CreateProject,
    InviteMembers,
    CreateChannel,
    CreateTask,
    JoinConversation,
    ExploreProjects,
    ReviewTasks,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetupStep {
    pub id: SetupStepId,
    pub label: String,
    pub description: String,
    pub completed: bool,
    pub href: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSetupProgress {
    pub persona: SetupPersona,
    pub steps: Vec<SetupStep>,
    pub completed_count: u8,
    pub total_count: u8,
}

#[derive(Debug, Clone)]
pub struct SetupProgressInput {
    pub persona: SetupPersona,
    pub team_count: usize,
    pub project_count: usize,
    pub member_count: usize,
    pub pending_invite_count: i64,
    pub channel_count: usize,
    pub has_joined_channel: bool,
    pub dm_thread_count: usize,
    pub empty_state: DashboardEmptyState,
}

pub fn build_setup_progress(input: SetupProgressInput) -> DashboardSetupProgress {
    let steps = match input.persona {
        SetupPersona::OrgAdmin => build_admin_setup_steps(&input),
        SetupPersona::OrgMember => build_member_setup_steps(&input),
    };
    let completed_count = steps.iter().filter(|step| step.completed).count() as u8;
    let total_count = steps.len() as u8;

    DashboardSetupProgress {
        persona: input.persona,
        steps,
        completed_count,
        total_count,
    }
}

fn build_admin_setup_steps(input: &SetupProgressInput) -> Vec<SetupStep> {
    let has_team = input.team_count > 0;
    let has_project = input.project_count > 0;
    let has_invited = input.member_count > 1 || input.pending_invite_count > 0;
    let has_channel = input.channel_count > 0;
    let has_task = input.empty_state.has_tasks;

    vec![
        SetupStep {
            id: SetupStepId::CreateTeam,
            label: "Create a team".into(),
            description: "Teams group related projects and members.".into(),
            completed: has_team,
            href: None,
        },
        SetupStep {
            id: SetupStepId::CreateProject,
            label: "Create a project".into(),
            description: "Projects are where tasks and work are tracked.".into(),
            completed: has_project,
            href: None,
        },
        SetupStep {
            id: SetupStepId::InviteMembers,
            label: "Invite teammates".into(),
            description: "Bring your team in so work can be assigned.".into(),
            completed: has_invited,
            href: None,
        },
        SetupStep {
            id: SetupStepId::CreateChannel,
            label: "Create a channel".into(),
            description: "Use channels for async team conversations.".into(),
            completed: has_channel,
            href: None,
        },
        SetupStep {
            id: SetupStepId::CreateTask,
            label: "Create your first task".into(),
            description: "Add a task to start tracking work.".into(),
            completed: has_task,
            href: if has_project {
                Some("/projects".into())
            } else {
                None
            },
        },
    ]
}

fn build_member_setup_steps(input: &SetupProgressInput) -> Vec<SetupStep> {
    let has_joined_conversation = input.has_joined_channel || input.dm_thread_count > 0;

    vec![
        SetupStep {
            id: SetupStepId::JoinConversation,
            label: "Join a conversation".into(),
            description: "Open Messages to join a channel or start a DM.".into(),
            completed: has_joined_conversation,
            href: Some("/messages".into()),
        },
        SetupStep {
            id: SetupStepId::ExploreProjects,
            label: "Explore projects".into(),
            description: if input.empty_state.has_projects {
                "Browse the projects your team is working on.".into()
            } else {
                "Projects will appear here once your team creates them.".into()
            },
            completed: input.empty_state.has_projects,
            href: Some("/projects".into()),
        },
        SetupStep {
            id: SetupStepId::ReviewTasks,
            label: "Review your tasks".into(),
            description: if input.empty_state.has_assigned_tasks {
                "You have tasks assigned — open them to get started.".into()
            } else {
                "Tasks appear here once a teammate assigns work to you.".into()
            },
            completed: input.empty_state.has_assigned_tasks,
            href: Some("/projects".into()),
        },
    ]
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
