export function parseInviteTokenFromRedirect(redirect: string): string | null {
  if (!redirect.startsWith("/accept-invite")) {
    return null;
  }

  try {
    const url = new URL(redirect, "http://localhost");
    return url.searchParams.get("token");
  } catch {
    return null;
  }
}
