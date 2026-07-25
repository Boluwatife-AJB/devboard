"use client";

import {
  useOrgPresence,
  usePresenceHeartbeat,
  usePresenceSubscription,
} from "@/hooks/use-presence";

/** Runs org-wide presence heartbeat + subscription for the dashboard shell. */
export function PresenceSync() {
  usePresenceHeartbeat();
  usePresenceSubscription();
  useOrgPresence();
  return null;
}
