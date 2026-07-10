"use client";

import {
  GitBranchIcon,
  PlusIcon,
  SignOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { sidebarBottomMenu, sidebarMenu } from "@/constant";
import { clearAuth } from "@/lib/auth/cookies";
import { Button } from "../ui/button";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/sign-in");
  };

  return (
    <div className="w-60 shrink-0 flex flex-col border-r border-outline bg-[#131313]">
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
        {sidebarMenu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-sm ${
              pathname === item.path
                ? "bg-surface-container-high text-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-outline space-y-3">
        <CreateProjectDialog
          trigger={
            <Button variant="outline" className="w-full">
              <PlusIcon data-icon="inline-start" /> New Project
            </Button>
          }
        />
        <nav className="space-y-4">
          {sidebarBottomMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-colors text-sm ${
                pathname === item.path
                  ? "bg-surface-container-high text-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded transition-colors text-sm text-on-surface-variant hover:bg-surface-container"
          >
            <SignOutIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
