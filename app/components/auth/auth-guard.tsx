"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { getAccessToken } from "@/lib/auth/cookies";

function subscribe(onStoreChange: () => void) {
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      onStoreChange();
    }
  };

  window.addEventListener("pageshow", onPageShow);
  return () => window.removeEventListener("pageshow", onPageShow);
}

function getAuthSnapshot() {
  return Boolean(getAccessToken());
}

function getServerAuthSnapshot() {
  return true;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const authed = useSyncExternalStore(
    subscribe,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  useEffect(() => {
    if (!authed) {
      window.location.replace("/sign-in");
    }
  }, [authed]);

  if (!authed) {
    return null;
  }

  return children;
}
