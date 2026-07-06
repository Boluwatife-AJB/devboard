import {
  ChatTextIcon,
  CheckSquareIcon,
  FolderIcon,
  GearIcon,
  SignOutIcon,
  SquaresFourIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { SidebarLink } from "@/types";

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
  {
    path: "/logout",
    name: "Logout",
    icon: SignOutIcon,
  },
];

export const projectCards = [
  {
    id: 1,
    scope: "design",
    title: "Atlas Core 1",
    description:
      "Standardizing component architecture across all enterprise applications.",
    status: "active",
    progress: 78,
    timeRemaining: "2 days",
    teamMembers: [
      {
        name: "John Doe",
        avatar: "https://github.com/john-doe.png",
      },
      {
        name: "Jane Doe",
        avatar: "https://github.com/jane-doe.png",
      },
      {
        name: "Jim Doe",
        avatar: "https://github.com/jim-doe.png",
      },
      {
        name: "Jill Doe",
        avatar: "https://github.com/jill-doe.png",
      },
    ],
  },
  {
    scope: "engineering",
    id: 2,
    title: "GraphQL Engine v2",
    description: "Optimizing query execution time and introducing automated…",
    status: "review",
    progress: 45,
    timeRemaining: "5 days",
    teamMembers: [
      {
        name: "Jim Doe",
        avatar: "https://github.com/jim-doe.png",
      },
      {
        name: "Jill Doe",
        avatar: "https://github.com/jill-doe.png",
      },
    ],
  },
  {
    scope: "marketing",
    id: 3,
    title: "Social Media Campaign",
    description:
      "Increasing brand awareness and driving engagement through social media.",
    status: "planning",
    progress: 100,
    timeRemaining: "14 days",
    teamMembers: [
      {
        name: "John Doe",
        avatar: "https://github.com/john-doe.png",
      },
    ],
  },
  {
    scope: "engineering",
    id: 4,
    title: "Payments System",
    description:
      "Implementing new payment gateway and improving the existing one.",
    status: "review",
    progress: 100,
    timeRemaining: "0 days",
    teamMembers: [
      {
        name: "Jim Doe",
        avatar: "https://github.com/jim-doe.png",
      },
      {
        name: "Jill Doe",
        avatar: "https://github.com/jill-doe.png",
      },
    ],
  },
];
