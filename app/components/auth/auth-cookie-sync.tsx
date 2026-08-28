"use client";

import { useEffect } from "react";
import { syncSelectedOrgContext } from "@/lib/auth/cookies";

export function AuthCookieSync() {
  useEffect(() => {
    syncSelectedOrgContext();
  }, []);

  return null;
}
