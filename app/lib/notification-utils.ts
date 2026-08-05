export function navigateToActionUrl(
  actionUrl: string | null | undefined,
  push: (href: string) => void,
) {
  if (!actionUrl) return;

  try {
    const parsed = new URL(actionUrl, window.location.origin);
    if (parsed.origin === window.location.origin) {
      push(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      return;
    }
    window.location.assign(actionUrl);
  } catch {
    push(actionUrl);
  }
}

const MENTION_TOKEN_RE = /@\[([^\]]+)\]\(user:[0-9a-fA-F-]{36}\)/g;

export function formatNotificationPreview(body: string): string {
  return body
    .replace(/<[^>]+>?/g, " ")
    .replace(MENTION_TOKEN_RE, "@$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
