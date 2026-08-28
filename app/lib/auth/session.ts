import { queryClient } from "@/lib/query-client";
import { clearAuth } from "./cookies";

export function logout() {
  clearAuth();
  queryClient.clear();
  if (typeof window !== "undefined") {
    window.location.replace("/sign-in");
  }
}
