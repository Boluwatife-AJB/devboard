import {
  BriefcaseIcon,
  BuildingsIcon,
  CalendarBlankIcon,
  ChartBarIcon,
  ChatsCircleIcon,
  ChatTextIcon,
  ClipboardTextIcon,
  FolderIcon,
  GearIcon,
  GitMergeIcon,
  LightningIcon,
  MapPinIcon,
  PlusSquareIcon,
  SquaresFourIcon,
  TerminalWindowIcon,
  UserCirclePlusIcon,
  UserIcon,
  UsersThreeIcon,
  WarningCircleIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Action } from "@/lib/rbac/actions";
import type {
  AttentionItem,
  ChannelMember,
  ChatMessage,
  CompletionPoint,
  DashboardStat,
  DirectMessage,
  EditProfileFormData,
  MemberProject,
  MemberTask,
  MessageChannel,
  NotificationSettingsFormData,
  ProfileActivityPoint,
  ProfileOverviewData,
  ProfileSettingsSection,
  QuickAction,
  RiskTask,
  SharedFile,
  SidebarLink,
  UpcomingEvent,
  WorkloadPoint,
} from "@/types";

export const sidebarMenu: SidebarLink[] = [
  {
    path: "/",
    name: "Dashboard",
    icon: SquaresFourIcon,
  },
  {
    path: "/projects",
    name: "Projects",
    icon: FolderIcon,
  },
  {
    path: "/teams",
    name: "Teams",
    icon: UsersThreeIcon,
  },
  // {
  //   path: "/tasks",
  //   name: "Tasks",
  //   icon: CheckSquareIcon,
  // },
  {
    path: "/messages",
    name: "Messages",
    icon: ChatTextIcon,
  },
  {
    path: "/settings",
    name: "Settings",
    icon: GearIcon,
    requiredAction: Action.InviteOrgMember,
  },
];

export const sidebarBottomMenu: SidebarLink[] = [
  {
    path: "/profile",
    name: "Profile",
    icon: UserIcon,
  },
];

export const channelsData = [
  {
    id: 1,
    name: "Engineering Sync",
    description:
      "Engineering sync is a channel for engineering team to sync up on the latest developments and projects.",
    slug: "engineering-sync",
  },
  {
    id: 2,
    name: "Product Sync",
    description:
      "Product sync is a channel for product team to sync up on the latest developments and projects.",
    slug: "product-sync",
  },
  {
    id: 3,
    name: "Marketing Sync",
    description:
      "Marketing sync is a channel for marketing team to sync up on the latest developments and projects.",
    slug: "marketing-sync",
  },
];

export const directMessagesData = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    name: "Jane Doe",
    email: "jane.doe@example.com",
    avatar: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    name: "Jim Beam",
    email: "jim.beam@example.com",
    avatar: "https://via.placeholder.com/150",
  },
];

export const messageChannels: MessageChannel[] = [
  {
    id: "engineering-sync",
    slug: "engineering-sync",
    name: "engineering-sync",
    description:
      "Central hub for engineering team coordination, standups, and technical discussions.",
    memberCount: 12,
    subtitle: "12 members | Daily standup & incident response",
  },
  {
    id: "design-critique",
    slug: "design-critique",
    name: "design-critique",
    description: "Design reviews and critique sessions.",
    memberCount: 8,
    subtitle: "8 members | Weekly design reviews",
  },
  {
    id: "ops-oncall",
    slug: "ops-oncall",
    name: "ops-oncall",
    description: "On-call rotations and operational alerts.",
    memberCount: 6,
    subtitle: "6 members | Ops & reliability",
  },
  {
    id: "product-roadmap",
    slug: "product-roadmap",
    name: "product-roadmap",
    description: "Product planning and roadmap discussions.",
    memberCount: 10,
    subtitle: "10 members | Roadmap planning",
  },
];

export const directMessages: DirectMessage[] = [
  {
    id: "dm-sarah",
    name: "Sarah Kang",
    initials: "SK",
    color: "#F97316",
    status: "online",
  },
  {
    id: "dm-marcus",
    name: "Marcus Reed",
    initials: "MR",
    color: "#F97316",
    status: "away",
  },
  {
    id: "dm-alex",
    name: "Alex Lim",
    initials: "AL",
    color: "#4D8EFF",
    status: "online",
  },
];

export const engineeringSyncMessages: ChatMessage[] = [
  {
    id: "msg-1",
    type: "commit",
    author: "Alex Lim",
    initials: "AL",
    avatarColor: "#4D8EFF",
    isSelf: false,
    timestamp: "10:12 AM",
    body: "Just pushed a fix for the N+1 query issue in member resolution. Can someone review when you get a chance?",
    commitHash: "8a2f41e",
    commitMessage: "Fixing N+1 issue in workspace member resolution",
  },
  {
    id: "msg-2",
    type: "text",
    author: "You",
    initials: "Y",
    avatarColor: "#64748B",
    isSelf: true,
    timestamp: "10:15 AM",
    body: "On it. I'll take a look after the standup.",
    read: true,
  },
  {
    id: "msg-3",
    type: "text",
    author: "Sarah Kang",
    initials: "SK",
    avatarColor: "#F97316",
    isSelf: false,
    timestamp: "10:18 AM",
    body: "Nice! This should help with the dashboard load times too 📈",
    reactions: [
      { emoji: "🚀", count: 3 },
      { emoji: "👀", count: 1 },
    ],
  },
];

export const channelMembers: ChannelMember[] = [
  {
    id: "1",
    name: "Sarah Kang",
    initials: "SK",
    color: "#F97316",
    status: "online",
  },
  {
    id: "2",
    name: "Marcus Reed",
    initials: "MR",
    color: "#F97316",
    status: "online",
  },
  {
    id: "3",
    name: "Alex Lim",
    initials: "AL",
    color: "#4D8EFF",
    status: "online",
  },
  {
    id: "4",
    name: "Jordan Lee",
    initials: "JL",
    color: "#22C55E",
    status: "offline",
  },
  {
    id: "5",
    name: "Priya Sharma",
    initials: "PS",
    color: "#EC4899",
    status: "online",
  },
];

export const sharedFiles: SharedFile[] = [
  {
    id: "f1",
    name: "graphql-schema-v2.pdf",
    size: "2.4 MB",
    date: "Oct 22",
    kind: "pdf",
  },
  {
    id: "f2",
    name: "dashboard-mockup.png",
    size: "890 KB",
    date: "Oct 21",
    kind: "image",
  },
  {
    id: "f3",
    name: "auth-service-spec.md",
    size: "12 KB",
    date: "Oct 20",
    kind: "code",
  },
];

export const adminStats: DashboardStat[] = [
  {
    id: "overdue",
    label: "Overdue",
    value: 8,
    hint: "Needs owner follow-up",
    icon: WarningCircleIcon,
    tone: "warning",
  },
  {
    id: "unassigned",
    label: "Unassigned",
    value: 24,
    hint: "4 marked critical",
    icon: UserIcon,
  },
  {
    id: "pending-invites",
    label: "Pending Invites",
    value: 3,
    hint: "Expire in 5 days",
    icon: UserCirclePlusIcon,
  },
  {
    id: "open-tasks",
    label: "Open Tasks",
    value: 143,
    hint: "18 moved this week",
    icon: ClipboardTextIcon,
  },
];

export const riskTasks: RiskTask[] = [
  {
    id: "1",
    key: "ENG-402",
    title: "Update auth schema migrations",
    status: "Blocked",
    dueLabel: "Overdue (2d)",
    overdue: true,
  },
  {
    id: "2",
    key: "WEB-118",
    title: "Finalize responsive nav implementation",
    status: "In Progress",
    dueLabel: "Today",
  },
  {
    id: "3",
    key: "SYS-899",
    title: "Audit logging missing entries",
    status: "In Progress",
    dueLabel: "in 3 days",
  },
];

export const attentionItems: AttentionItem[] = [
  {
    id: "1",
    title: "High-priority unassigned tasks",
    description: "4 critical bugs waiting for an owner",
    actionLabel: "Assign",
  },
  {
    id: "2",
    title: "Stale reviews",
    description: "7 PRs stuck without reviewer activity",
    actionLabel: "Ping Reviewers",
  },
  {
    id: "3",
    title: "Pending invitations",
    description: "3 team members have not accepted yet",
    actionLabel: "Resend Invites",
  },
];

export const adminQuickActions: QuickAction[] = [
  {
    id: "create-project",
    label: "Create Project",
    href: "/projects",
    icon: FolderIcon,
  },
  {
    id: "invite-member",
    label: "Invite Member",
    href: "/settings",
    icon: UserCirclePlusIcon,
  },
  {
    id: "create-team",
    label: "Create Team",
    href: "/teams",
    icon: UsersThreeIcon,
  },
  {
    id: "open-settings",
    label: "Open Settings",
    href: "/settings",
    icon: GearIcon,
  },
];

export const workloadData: WorkloadPoint[] = [
  { team: "FE", todo: 12, inProgress: 18, done: 24 },
  { team: "BE", todo: 16, inProgress: 22, done: 30 },
  { team: "Des", todo: 8, inProgress: 10, done: 14 },
  { team: "QA", todo: 10, inProgress: 14, done: 20 },
  { team: "Ops", todo: 6, inProgress: 9, done: 16 },
];

export const memberStats: DashboardStat[] = [
  {
    id: "assigned",
    label: "Assigned to Me",
    value: 9,
    hint: "2 started today",
    icon: ClipboardTextIcon,
    tone: "accent",
  },
  {
    id: "due-week",
    label: "Due This Week",
    value: 4,
    hint: "Next due tomorrow",
    icon: CalendarBlankIcon,
  },
  {
    id: "overdue",
    label: "Overdue",
    value: 1,
    hint: "Blocker for ENG-402",
    icon: WarningCircleIcon,
    tone: "warning",
  },
];

export const memberTasks: MemberTask[] = [
  {
    id: "1",
    key: "DEV-4921",
    title: "Update API documentation for auth endpoints",
    status: "OVERDUE",
    dueLabel: "Yesterday",
  },
  {
    id: "2",
    key: "DEV-4888",
    title: "Wire notification preferences to GraphQL",
    status: "IN_PROGRESS",
    dueLabel: "Tomorrow",
  },
  {
    id: "3",
    key: "DEV-4902",
    title: "Polish empty states on projects page",
    status: "TODO",
    dueLabel: "Oct 24",
  },
  {
    id: "4",
    key: "DEV-4870",
    title: "Add invite resend action in settings",
    status: "IN_PROGRESS",
    dueLabel: "Oct 25",
  },
];

export const memberProjects: MemberProject[] = [
  {
    id: "1",
    name: "Core Infrastructure v3",
    tag: "Q4",
    openTasks: 14,
    members: [
      { id: "a", name: "Alex Lim", initials: "AL" },
      { id: "b", name: "Sarah Kang", initials: "SK" },
      { id: "c", name: "Marcus Reed", initials: "MR" },
    ],
  },
  {
    id: "2",
    name: "Developer Experience",
    tag: "Active",
    openTasks: 8,
    members: [
      { id: "d", name: "Jordan Lee", initials: "JL" },
      { id: "e", name: "Priya Sharma", initials: "PS" },
    ],
  },
];

export const memberQuickActions: QuickAction[] = [
  {
    id: "create-task",
    label: "Create task",
    href: "/projects",
    icon: PlusSquareIcon,
  },
  {
    id: "messages",
    label: "Messages",
    href: "/messages",
    icon: ChatTextIcon,
  },
];

export const upcomingEvents: UpcomingEvent[] = [
  {
    id: "1",
    dateLabel: "OCT 24",
    title: "Sprint Review",
    time: "10:00 AM",
  },
  {
    id: "2",
    dateLabel: "OCT 28",
    title: "Design Critique",
    time: "2:00 PM",
  },
  {
    id: "3",
    dateLabel: "NOV 01",
    title: "Planning Poker",
    time: "11:30 AM",
  },
];

export const completionTrend: CompletionPoint[] = [
  { day: "Mon", completed: 2 },
  { day: "Tue", completed: 4 },
  { day: "Wed", completed: 3 },
  { day: "Thu", completed: 5 },
  { day: "Fri", completed: 4 },
  { day: "Sat", completed: 1 },
  { day: "Sun", completed: 2 },
  { day: "Mon", completed: 6 },
  { day: "Tue", completed: 5 },
  { day: "Wed", completed: 7 },
  { day: "Thu", completed: 4 },
  { day: "Fri", completed: 8 },
  { day: "Sat", completed: 3 },
  { day: "Today", completed: 5 },
];

export const profileOverviewData: ProfileOverviewData = {
  firstName: "Alex",
  lastName: "Mercer",
  handle: "amercer",
  role: "Senior Product Designer",
  team: "Design Systems",
  location: "San Francisco, CA",
  stats: [
    {
      id: "tasks-completed",
      label: "Tasks Completed",
      value: "1,204",
      icon: LightningIcon,
      tone: "accent",
    },
    {
      id: "prs-merged",
      label: "PRs Merged",
      value: "342",
      icon: GitMergeIcon,
      tone: "warning",
    },
    {
      id: "comments-made",
      label: "Comments Made",
      value: "8.4k",
      icon: ChatsCircleIcon,
    },
  ],
  activeProjects: [
    {
      id: "1",
      name: "Component Library V2",
      status: "In Progress",
      progress: 75,
      members: [
        { id: "a", name: "Alex Mercer", initials: "AM" },
        { id: "b", name: "Sarah Kang", initials: "SK" },
        { id: "c", name: "Marcus Reed", initials: "MR" },
      ],
    },
    {
      id: "2",
      name: "Mobile Onboarding Flow",
      status: "Review",
      progress: 40,
      members: [
        { id: "d", name: "Jordan Lee", initials: "JL" },
        { id: "e", name: "Priya Sharma", initials: "PS" },
      ],
    },
    {
      id: "3",
      name: "Design Token Audit",
      status: "Planned",
      progress: 0,
      members: [{ id: "f", name: "Alex Mercer", initials: "AM" }],
    },
  ],
  activity: [
    { date: "Oct 1", completed: 12 },
    { date: "Oct 8", completed: 18 },
    { date: "Oct 15", completed: 24 },
    { date: "Oct 22", completed: 32 },
    { date: "Oct 30", completed: 28 },
  ] satisfies ProfileActivityPoint[],
  teams: [
    {
      id: "1",
      name: "Core Design Systems",
      memberCount: 12,
      role: "Lead",
      icon: WrenchIcon,
    },
    {
      id: "2",
      name: "Platform Engineering",
      memberCount: 8,
      role: "Contributor",
      icon: TerminalWindowIcon,
    },
  ],
};

export const editProfileDefaults: EditProfileFormData = {
  firstName: "Alex",
  lastName: "Chen",
  displayName: "achen_dev",
  pronouns: "He / Him",
  title: "Senior Product Designer",
  bio: "Building design systems and developer experience tools.",
  location: "San Francisco, CA",
  phone: "+1 (415) 555-0192",
  website: "https://alexmercer.dev",
  twitter: "@amercer",
  github: "amercer",
  linkedin: "alex-mercer",
};

export const notificationSettingsDefaults: NotificationSettingsFormData = {
  taskAssigned: true,
  taskDueSoon: true,
  mentions: true,
  taskComments: false,
  channelMessages: true,
  announcements: true,
  emailDigest: false,
};

export const profileSettingsNav: {
  id: ProfileSettingsSection;
  label: string;
}[] = [
  {
    id: "general",
    label: "General",
  },
  {
    id: "notifications",
    label: "Notifications",
  },
  {
    id: "security",
    label: "Security",
  },
];

export const profileDetailIcons = {
  role: BriefcaseIcon,
  team: BuildingsIcon,
  location: MapPinIcon,
  activeProjects: LightningIcon,
  activity: ChartBarIcon,
  teams: UsersThreeIcon,
};

export const profilePronounOptions = [
  "He / Him",
  "She / Her",
  "They / Them",
  "Prefer not to say",
] as const;
