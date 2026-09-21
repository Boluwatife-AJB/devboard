"use client";

import { NotificationSync } from "@/components/notifications/notification-sync";
import { PresenceSync } from "@/components/presence/presence-sync";
import { useOrg } from "@/context/org-context";

export function DashboardRealtimeSync() {
  const { wsGeneration } = useOrg();
  return (
    <>
      <PresenceSync key={`presence-${wsGeneration}`} />
      <NotificationSync key={`notification-${wsGeneration}`} />
    </>
  );
}
