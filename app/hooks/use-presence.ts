"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { privateApi } from "@/lib/api";
import { getAccessToken, getSelectedOrgId } from "@/lib/auth/cookies";
import { graphqlRequest } from "@/lib/graphql/client";
import { ORG_PRESENCE_QUERY } from "@/lib/graphql/documents";
import type { ApiUserPresence, PresenceStatus } from "@/types";
import { usePresenceEvents } from "./use-messaging-events";

export const presenceKeys = {
  org: ["org-presence"] as const,
};

const HEARTBEAT_INTERVAL_MS = 30_000;

function statusForPath(pathname: string, visible: boolean): PresenceStatus {
  if (!visible) return "AWAY";
  if (pathname.startsWith("/messages")) return "ONLINE";
  return "AWAY";
}

async function sendHeartbeat(status: PresenceStatus) {
  if (!getAccessToken() || !getSelectedOrgId()) return;
  await privateApi.post("/presence/heartbeat", { status });
}

/** Snapshot of org member presence (shared React Query cache). */
export function useOrgPresence() {
  return useQuery({
    queryKey: presenceKeys.org,
    queryFn: async () => {
      const data = await graphqlRequest<{ orgPresence: ApiUserPresence[] }>(
        ORG_PRESENCE_QUERY,
      );
      return Object.fromEntries(
        data.orgPresence.map((presence) => [presence.userId, presence.status]),
      ) as Record<string, PresenceStatus>;
    },
    enabled: Boolean(getAccessToken() && getSelectedOrgId()),
    staleTime: 15_000,
  });
}

/** Live presence updates into the shared org-presence cache. Mount once. */
export function usePresenceSubscription() {
  const queryClient = useQueryClient();

  usePresenceEvents((presence) => {
    queryClient.setQueryData<Record<string, PresenceStatus>>(
      presenceKeys.org,
      (current) => ({
        ...current,
        [presence.userId]: presence.status,
      }),
    );
  });
}

/**
 * Keeps Redis presence fresh while the dashboard is open.
 * ONLINE on /messages, AWAY elsewhere (and when the tab is hidden).
 */
export function usePresenceHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const beat = async () => {
      const status = statusForPath(
        pathname,
        typeof document === "undefined"
          ? true
          : document.visibilityState === "visible",
      );
      if (cancelled) return;
      try {
        await sendHeartbeat(status);
      } catch {
        // Best-effort; next interval retries.
      }
    };

    void beat();
    const intervalId = window.setInterval(() => {
      void beat();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibility = () => {
      void beat();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onUnload = () => {
      if (!getAccessToken() || !getSelectedOrgId()) return;
      const body = JSON.stringify({ status: "OFFLINE" });
      const url = `${privateApi.defaults.baseURL}/presence/heartbeat`;
      const token = getAccessToken();
      const orgId = getSelectedOrgId();
      void fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(orgId ? { "X-Organization-Id": orgId } : {}),
        },
        body,
        keepalive: true,
      });
    };
    window.addEventListener("pagehide", onUnload);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [pathname]);
}
