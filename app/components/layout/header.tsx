import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { HeaderUserAvatar } from "@/components/layout/header-user-avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Input } from "../ui/input";
import { OrgSwitcher } from "./org-switcher";

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-sidebar-border bg-sidebar px-8">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          id="text"
          className="py-6 pl-11 border border-devboard-neutral focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150 w-96 placeholder:text-sm text-sm rounded-xs"
          placeholder="Search tasks, projects, users..."
          type="text"
          autoComplete="off"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        <OrgSwitcher />

        <div className="h-6 w-px bg-sidebar-border" />

        {/* <Button className="px-3 py-1.5 bg-devboard-primary hover:bg-devboard-primary/90 text-white rounded text-xs font-medium transition-opacity flex items-center gap-2">
          <RocketLaunchIcon className="w-5 h-5" />
          Deploy
        </Button> */}

        <NotificationBell />

        <HeaderUserAvatar />
      </div>
    </header>
  );
}
