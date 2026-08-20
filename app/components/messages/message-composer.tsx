"use client";

import {
  AtIcon,
  CodeIcon,
  LinkIcon,
  ListBulletsIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  SmileyIcon,
  TextBIcon,
  TextItalicIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageMention, serializeMentionsForApi } from "@/lib/tiptap-mention";
import { cn } from "@/lib/utils";

export type MentionCandidate = {
  id: string;
  displayName: string;
};

type MessageComposerProps = {
  channelName: string;
  mentionCandidates?: MentionCandidate[];
  onSend?: (html: string, text: string) => void;
};

export function MessageComposer({
  channelName,
  mentionCandidates = [],
  onSend,
}: MessageComposerProps) {
  const [isEmpty, setIsEmpty] = useState(true);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const handleSendRef = useRef<() => void>(() => {});
  const mentionOpenRef = useRef(false);
  mentionOpenRef.current = mentionOpen;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#4D8EFF] underline underline-offset-2",
        },
      }),
      MessageMention,
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      setIsEmpty(current.isEmpty);

      const { from } = current.state.selection;
      const textBefore = current.state.doc.textBetween(
        Math.max(0, from - 40),
        from,
        "\n",
        "\n",
      );
      const match = textBefore.match(/@([^\s@[]*)$/);
      if (match) {
        setMentionOpen(true);
        setMentionQuery(match[1] ?? "");
      } else {
        setMentionOpen(false);
        setMentionQuery("");
      }
    },
    editorProps: {
      attributes: {
        class:
          "min-h-20 max-h-40 overflow-y-auto px-4 py-3 text-sm text-white outline-none focus:outline-none [&_p]:m-0 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_code]:rounded-xs [&_code]:bg-[#1C1B1B] [&_code]:px-1 [&_code]:font-mono [&_code]:text-[#ADC6FF] [&_.mention]:text-[#4D8EFF] [&_.mention]:font-medium",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape" && mentionOpenRef.current) {
          setMentionOpen(false);
          setMentionQuery("");
          return true;
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSendRef.current();
          return true;
        }
        return false;
      },
    },
  });

  const filteredMentions = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    if (!q) return mentionCandidates.slice(0, 8);
    return mentionCandidates
      .filter((c) => c.displayName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [mentionCandidates, mentionQuery]);

  const insertMention = (candidate: MentionCandidate) => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, from - 40),
      from,
      "\n",
      "\n",
    );
    const match = textBefore.match(/@([^\s@[]*)$/);
    const deleteCount = match ? match[0].length : 0;

    editor
      .chain()
      .focus()
      .deleteRange({ from: from - deleteCount, to: from })
      .insertContent([
        {
          type: "messageMention",
          attrs: {
            id: candidate.id,
            label: candidate.displayName,
          },
        },
        { type: "text", text: " " },
      ])
      .run();

    setMentionOpen(false);
    setMentionQuery("");
  };

  const openMentionMenu = () => {
    if (!editor) return;
    editor.chain().focus().insertContent("@").run();
    setMentionOpen(true);
    setMentionQuery("");
  };

  const handleSend = () => {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) return;

    const html = serializeMentionsForApi(editor.getHTML());
    onSend?.(html, text);
    editor.commands.clearContent(true);
    setIsEmpty(true);
    setMentionOpen(false);
    setMentionQuery("");
  };

  handleSendRef.current = handleSend;

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="border-t border-[#2A2A2A] p-4">
        <div className="h-36 animate-pulse rounded-xs border border-[#2A2A2A] bg-[#131313]" />
      </div>
    );
  }

  return (
    <div className="border-t border-[#2A2A2A] p-4">
      <div className="relative overflow-hidden rounded-xs border border-[#2A2A2A] bg-[#131313]">
        <div className="flex items-center gap-1 border-b border-[#2A2A2A] px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Bold"
            aria-pressed={editor.isActive("bold")}
            className={cn(editor.isActive("bold") && "bg-[#1C1B1B] text-white")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <TextBIcon className="size-3.5" weight="bold" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Italic"
            aria-pressed={editor.isActive("italic")}
            className={cn(
              editor.isActive("italic") && "bg-[#1C1B1B] text-white",
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <TextItalicIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Code"
            aria-pressed={editor.isActive("code")}
            className={cn(editor.isActive("code") && "bg-[#1C1B1B] text-white")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <CodeIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Link"
            aria-pressed={editor.isActive("link")}
            className={cn(editor.isActive("link") && "bg-[#1C1B1B] text-white")}
            onClick={setLink}
          >
            <LinkIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="List"
            aria-pressed={editor.isActive("bulletList")}
            className={cn(
              editor.isActive("bulletList") && "bg-[#1C1B1B] text-white",
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <ListBulletsIcon className="size-3.5" />
          </Button>
        </div>

        <div className="relative">
          {isEmpty && (
            <p className="pointer-events-none absolute left-4 top-3 text-sm text-[#8A8A8A]">
              Message #{channelName}
            </p>
          )}
          <EditorContent editor={editor} />

          {mentionOpen && mentionCandidates.length > 0 && (
            <div className="absolute bottom-full left-3 z-20 mb-1 w-64 overflow-hidden rounded-xs border border-[#2A2A2A] bg-[#131313] shadow-lg">
              {filteredMentions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[#8A8A8A]">No matches</p>
              ) : (
                <ul className="max-h-48 overflow-y-auto py-1">
                  {filteredMentions.map((candidate) => (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        className="flex w-full px-3 py-1.5 text-left text-sm text-[#E5E5E5] hover:bg-[#1C1B1B]"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          insertMention(candidate);
                        }}
                      >
                        @{candidate.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2A2A2A] px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Attach"
            >
              <PlusIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Emoji"
            >
              <SmileyIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Mention"
              disabled={mentionCandidates.length === 0}
              onClick={openMentionMenu}
            >
              <AtIcon className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            className="h-8 rounded-xs bg-[#4D8EFF] px-3 text-xs text-white hover:bg-[#4D8EFF]/80"
            onClick={handleSend}
            disabled={isEmpty}
          >
            <PaperPlaneTiltIcon data-icon="inline-start" className="size-3.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
