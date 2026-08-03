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
