import { clearAuth } from "./cookies";

export function logout() {
  clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/sign-in";
  }
}
