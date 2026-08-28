"use client";

import {
  GitBranchIcon,
  PlusIcon,
  SignOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { sidebarBottomMenu, sidebarMenu } from "@/constant";
import { useCanCreateProject } from "@/hooks/use-can-create-project";
import { useOrgAuthz } from "@/hooks/use-org-authz";
import { clearAuth } from "@/lib/auth/cookies";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

function sidebarNavLinkClass(isActive: boolean) {
  return cn(
    "flex w-full items-center gap-3 rounded-xs px-4 py-2.5 text-sm transition-colors",
    isActive
      ? "bg-muted text-primary"
      : "text-muted-foreground hover:bg-muted/50 hover:text-sidebar-foreground",
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { can, ready } = useOrgAuthz();
  const { canCreate: canCreateProject, ready: projectAuthReady } =
    useCanCreateProject();

  const visibleMenu = useMemo(
    () =>
      sidebarMenu.filter(
        (item) => !item.requiredAction || (ready && can(item.requiredAction)),
      ),
    [can, ready],
  );

  const handleLogout = () => {
    clearAuth();
    router.push("/sign-in");
  };

  return (
    <div className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo Section */}
      <div className="px-6 py-4 h-20 border-b border-outline">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-10 bg-[#6177A5] rounded flex items-center justify-center">
            <GitBranchIcon className="text-on-surface size-4" />
          </div>
          <div className="-space-y-1">
            <h1 className="font-bold text-2xl text-[#6177A5]">DevBoard</h1>
            <p className="text-xs font-mono">V1.0.0</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-4 px-4 pt-8">
        {visibleMenu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={sidebarNavLinkClass(pathname === item.path)}
          >
            <item.icon className="size-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-3 border-t border-sidebar-border p-4">
        {projectAuthReady && canCreateProject && (
          <CreateProjectDialog
            trigger={
              <Button
                variant="outline"
                className="w-full border-border bg-sidebar text-sidebar-foreground hover:border-devboard-primary/40 hover:bg-muted/40"
              >
                <PlusIcon data-icon="inline-start" /> New Project
              </Button>
            }
          />
        )}
        <nav className="space-y-4">
          {sidebarBottomMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={sidebarNavLinkClass(pathname === item.path)}
            >
              <item.icon className="size-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className={sidebarNavLinkClass(false)}
          >
            <SignOutIcon className="size-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
