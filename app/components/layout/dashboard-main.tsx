"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMessagesRoute =
    pathname === "/messages" || pathname.startsWith("/messages/");

  return (
    <main
      className={cn("min-w-0 flex-1 overflow-auto", !isMessagesRoute && "p-8")}
    >
      {children}
    </main>
  );
}
