const MENTION_RE = /@\[([^\]]+)\]\(user:([0-9a-fA-F-]{36})\)/g;

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "EM",
  "B",
  "I",
  "CODE",
  "UL",
  "OL",
  "LI",
  "A",
  "SPAN",
]);

const BUBBLE_HTML_CLASS =
  "text-sm leading-relaxed text-[#E5E5E5] [&_p]:m-0 [&_a]:text-[#4D8EFF] [&_a]:underline [&_a]:underline-offset-2 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded-xs [&_code]:bg-[#1C1B1B] [&_code]:px-1 [&_code]:font-mono [&_code]:text-[#ADC6FF] [&_strong]:font-semibold [&_em]:italic";

export function messageBubbleHtmlClassName(extra?: string) {
  return extra ? `${BUBBLE_HTML_CLASS} ${extra}` : BUBBLE_HTML_CLASS;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHref(href: string | null): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("mailto:")) {
    return trimmed;
  }
  return null;
}

/** DOM allowlist sanitizer for TipTap message HTML (client-side). */
function sanitizeMessageHtml(html: string): string {
  if (typeof document === "undefined") {
    return escapeHtml(html.replace(/<[^>]+>/g, ""));
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!ALLOWED_TAGS.has(el.tagName)) {
          el.replaceWith(...Array.from(el.childNodes));
          walk(node);
          continue;
        }

        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          if (el.tagName === "A" && name === "href") {
            const safe = sanitizeHref(attr.value);
            if (safe) {
              el.setAttribute("href", safe);
              el.setAttribute("target", "_blank");
              el.setAttribute("rel", "noopener noreferrer");
            } else {
              el.removeAttribute(attr.name);
            }
            continue;
          }
          if (
            el.tagName === "SPAN" &&
            (name === "class" || name === "data-user-id")
          ) {
            continue;
          }
          if (name === "class" && el.tagName !== "SPAN") {
            el.removeAttribute(attr.name);
            continue;
          }
          el.removeAttribute(attr.name);
        }

        walk(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  };

  walk(template.content);
  return template.innerHTML;
}

/**
 * Turns mention tokens into styled chips, then sanitizes TipTap HTML for
 * safe rendering in message bubbles.
 */
export function formatMessageHtml(body: string): string {
  if (!body.trim()) return "";

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(body);
  const source = looksLikeHtml ? body : `<p>${escapeHtml(body)}</p>`;

  const withMentions = source.replace(
    MENTION_RE,
    (_match, name: string, id: string) =>
      `<span class="mention text-[#4D8EFF] font-medium" data-user-id="${escapeHtml(id)}">@${escapeHtml(name)}</span>`,
  );

  // TipTap mention nodes (before API serialization) — display as @label only
  const withEditorMentions = withMentions.replace(
    /<span[^>]*data-type="mention"[^>]*data-user-id="([^"]*)"[^>]*data-label="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi,
    (_match, id: string, label: string) =>
      `<span class="mention text-[#4D8EFF] font-medium" data-user-id="${escapeHtml(id)}">@${escapeHtml(label)}</span>`,
  );

  return sanitizeMessageHtml(withEditorMentions);
}

/** Plain text for clipboard / empty checks. */
export function messagePlainText(body: string): string {
  if (typeof document === "undefined") {
    return body
      .replace(MENTION_RE, (_m, name: string) => `@${name}`)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const html = formatMessageHtml(body);
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent ?? "").trim();
}
