import {
  ChatTextIcon,
  CheckSquareIcon,
  FolderIcon,
  GearIcon,
  SquaresFourIcon,
  UserIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type {
  ChannelMember,
  ChatMessage,
  DirectMessage,
  MessageChannel,
  SharedFile,
  SidebarLink,
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
  {
    path: "/tasks",
    name: "Tasks",
    icon: CheckSquareIcon,
  },
  {
    path: "/messages",
    name: "Messages",
    icon: ChatTextIcon,
  },
  {
    path: "/settings",
    name: "Settings",
    icon: GearIcon,
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
