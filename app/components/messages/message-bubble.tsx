"use client";

import { SmileyIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { toast } from "sonner";
import { EmbedCard } from "@/components/messages/embed-card";
import { SquareAvatar } from "@/components/messages/square-avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAddReaction, useRemoveReaction } from "@/hooks/use-messaging";
import { getApiErrorMessage } from "@/lib/api";
import { formatTime } from "@/lib/message-utils";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type { DisplayMessage } from "@/types";

const ALLOWED_REACTIONS = [
  "👍",
  "❤️",
  "🚀",
  "👀",
  "👎",
  "🤔",
  "👏",
  "✅",
  "😂",
  "🎉",
  "🔥",
] as const;

export function MessageBubble({
  message,
  authorName,
  isSelf,
  channelId,
  canReact = false,
}: {
  message: DisplayMessage;
  authorName: string;
  isSelf: boolean;
  channelId?: string;
  canReact?: boolean;
}) {
  const editedSuffix = message.isEdited ? " (edited)" : "";
  const [pickerOpen, setPickerOpen] = useState(false);
  const addReaction = useAddReaction(channelId ?? "");
  const removeReaction = useRemoveReaction(channelId ?? "");
  const reacting = addReaction.isPending || removeReaction.isPending;

  const handleToggle = async (emoji: string) => {
    if (!channelId || !canReact || reacting) return;
    const existing = message.reactions?.find(
      (reaction) => reaction.emoji === emoji,
    );
    try {
      if (existing?.reactedByMe) {
        await removeReaction.mutateAsync({ messageId: message.id, emoji });
      } else {
        await addReaction.mutateAsync({ messageId: message.id, emoji });
      }
      setPickerOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const reactionBar =
    canReact || (message.reactions && message.reactions.length > 0) ? (
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {(message.reactions ?? []).map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            disabled={!canReact || reacting}
            onClick={() => handleToggle(reaction.emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-xs transition-colors",
              reaction.reactedByMe
                ? "border-[#4D8EFF66] bg-[#4D8EFF1A] text-[#ADC6FF]"
                : "border-[#2A2A2A] bg-[#1C1B1B] text-[#C2C6D6] hover:border-[#4D8EFF66]",
              !canReact && "cursor-default",
            )}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        ))}
        {canReact && (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-[#8A8A8A] hover:text-white"
                  aria-label="Add reaction"
                  disabled={reacting}
                >
                  <SmileyIcon className="size-4" />
                </Button>
              }
            />
            <PopoverContent
              align={isSelf ? "end" : "start"}
              className="w-auto border-[#2A2A2A] bg-[#131313] p-2"
            >
              <div className="grid grid-cols-6 gap-1">
                {ALLOWED_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded-xs p-1.5 text-base hover:bg-[#1C1B1B]"
                    onClick={() => handleToggle(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    ) : null;

  if (isSelf) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] space-y-1">
          <p className="text-right text-[10px] text-[#8A8A8A]">
            {formatTime(message.createdAt)} · You{editedSuffix}
          </p>
          <div className="whitespace-pre-wrap rounded-xs border border-[#2A2A2A] bg-[#1C1B1B] px-4 py-3 text-sm leading-relaxed text-[#E5E5E5]">
            {message.body}
          </div>
          {reactionBar}
          {message.isRead && (
            <p className="flex items-center justify-end gap-1 text-[10px] text-[#4D8EFF]">
              <span className="inline-block size-3 rounded-full border border-[#4D8EFF]" />
              Read
            </p>
          )}
        </div>
        <SquareAvatar
          initials={initialsOf(authorName)}
          color={avatarColorOf(message.authorId)}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <SquareAvatar
        initials={initialsOf(authorName)}
        color={avatarColorOf(message.authorId)}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs text-[#8A8A8A]">
          <span className="font-semibold text-white">{authorName}</span>{" "}
          {formatTime(message.createdAt)}
          {editedSuffix}
        </p>
        <div className="space-y-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#E5E5E5]">
            {message.body}
          </p>
          {message.embeds?.map((embed) => (
            <EmbedCard key={embed.url} embed={embed} />
          ))}
          {reactionBar}
        </div>
      </div>
    </div>
  );
}
