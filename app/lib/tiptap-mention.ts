import { mergeAttributes, Node } from "@tiptap/core";

export type MessageMentionAttrs = {
  id: string;
  label: string;
};

/**
 * Inline atom that shows as "@Name" in the editor while carrying user id
 * for serialization as `@[Name](user:<uuid>)` on send.
 */
export const MessageMention = Node.create({
  name: "messageMention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-user-id"),
        renderHTML: (attributes) =>
          attributes.id ? { "data-user-id": attributes.id } : {},
      },
      label: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-label") ??
          element.textContent?.replace(/^@/, "") ??
          null,
        renderHTML: (attributes) =>
          attributes.label ? { "data-label": attributes.label } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="mention"]' }];
  },

  renderHTML({ node }) {
    return [
      "span",
      mergeAttributes({
        "data-type": "mention",
        class: "mention text-[#4D8EFF] font-medium",
        "data-user-id": node.attrs.id,
        "data-label": node.attrs.label,
      }),
      `@${node.attrs.label ?? ""}`,
    ];
  },

  renderText({ node }) {
    const label = node.attrs.label ?? "";
    const id = node.attrs.id ?? "";
    return `@[${label}](user:${id})`;
  },
});

/** Replace editor mention spans with `@[Name](user:id)` tokens for the API. */
export function serializeMentionsForApi(html: string): string {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content
    .querySelectorAll("span[data-type='mention']")
    .forEach((span) => {
      const id = span.getAttribute("data-user-id") ?? "";
      const label =
        span.getAttribute("data-label") ??
        span.textContent?.replace(/^@/, "") ??
        "";
      span.replaceWith(document.createTextNode(`@[${label}](user:${id})`));
    });

  return template.innerHTML;
}
