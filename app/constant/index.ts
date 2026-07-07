import {
  ChatTextIcon,
  CheckSquareIcon,
  FolderIcon,
  GearIcon,
  SquaresFourIcon,
  UserIcon,
  UsersThreeIcon,
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
