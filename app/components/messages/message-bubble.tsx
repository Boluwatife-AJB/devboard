"use client";

import {
  CaretDownIcon,
  CopyIcon,
  PencilSimpleIcon,
  SmileyIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { toast } from "sonner";
import { EmbedCard } from "@/components/messages/embed-card";
import { SquareAvatar } from "@/components/messages/square-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddReaction,
  useDeleteMessage,
  useEditMessage,
  useRemoveReaction,
} from "@/hooks/use-messaging";
import { getApiErrorMessage } from "@/lib/api";
import { getSelectedOrgId } from "@/lib/auth/cookies";
import { canEditMessage, formatTime } from "@/lib/message-utils";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const addReaction = useAddReaction(channelId ?? "");
  const removeReaction = useRemoveReaction(channelId ?? "");
  const editMessage = useEditMessage(channelId ?? "");
  const deleteMessage = useDeleteMessage(channelId ?? "");
  const reacting = addReaction.isPending || removeReaction.isPending;
  const canEdit = Boolean(channelId) && canEditMessage(message.createdAt);
  const canManage = Boolean(channelId);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      toast.success("Message copied");
    } catch {
      toast.error("Failed to copy message");
    }
  };

  const handleStartEdit = () => {
    if (!canEdit) {
      toast.error("Messages can only be edited within 15 minutes");
      return;
    }
    setDraft(message.body);
    setEditing(true);
  };

  const handleSaveEdit = () => {
    const body = draft.trim();
    if (!body || !channelId) return;
    editMessage.mutate(
      { messageId: message.id, body },
      {
        onSuccess: () => setEditing(false),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleConfirmDelete = () => {
    const orgId = getSelectedOrgId();
    if (!channelId || !orgId) {
      toast.error("Missing organization context");
      return;
    }
    deleteMessage.mutate(
      { messageId: message.id, orgId },
      {
        onSuccess: () => setDeleteOpen(false),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const reactionBar =
    canReact || (message.reactions && message.reactions.length > 0) ? (
      <div
        className={cn(
          "flex w-fit flex-wrap items-center gap-1.5",
          isSelf && "self-end",
        )}
      >
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

  const avatar = (
    <MessageAvatar className="rounded-none bg-transparent">
      <SquareAvatar
        initials={initialsOf(authorName)}
        color={avatarColorOf(message.authorId)}
      />
    </MessageAvatar>
  );

  if (isSelf) {
    return (
      <>
        <Message align="end">
          {avatar}
          <MessageContent className="max-w-[85%]">
            <MessageHeader className="justify-end px-0 text-[10px] text-[#8A8A8A]">
              {formatTime(message.createdAt)} · You{editedSuffix}
            </MessageHeader>

            <div className="group/actions relative w-fit max-w-full self-end">
              <Bubble
                variant="muted"
                align="end"
                className="max-w-full *:data-[slot=bubble-content]:bg-[#1C1B1B] *:data-[slot=bubble-content]:text-[#E5E5E5]"
              >
                <BubbleContent className="w-full border border-[#2A2A2A] text-sm leading-relaxed whitespace-pre-wrap pr-3!">
                  {editing ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        className="min-h-20 border-[#2A2A2A] bg-[#0B0E14] text-sm text-[#E5E5E5]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setEditing(false)}
                          disabled={editMessage.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 bg-[#4D8EFF] text-xs text-white hover:bg-[#4D8EFF]/80"
                          onClick={handleSaveEdit}
                          disabled={editMessage.isPending || !draft.trim()}
                        >
                          {editMessage.isPending ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    message.body
                  )}
                </BubbleContent>
              </Bubble>

              {!editing && (
                <div
                  className={cn(
                    "absolute top-0 right-0 transition-opacity",
                    menuOpen
                      ? "opacity-100"
                      : "opacity-0 group-hover/actions:opacity-100",
                  )}
                >
                  <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="flex size-5 items-center justify-center text-[#8A8A8A] hover:text-white"
                          aria-label="Message actions"
                        >
                          <CaretDownIcon className="size-3.5" weight="bold" />
                        </button>
                      }
                    />
                    <DropdownMenuContent
                      align="end"
                      className="w-40 border-[#2A2A2A] bg-[#131313]"
                    >
                      <DropdownMenuGroup>
                        {canManage && (
                          <DropdownMenuItem onClick={handleStartEdit}>
                            <PencilSimpleIcon className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleCopy}>
                          <CopyIcon className="size-4" />
                          Copy
                        </DropdownMenuItem>
                        {canManage && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteOpen(true)}
                          >
                            <TrashIcon className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {reactionBar}

            {message.isRead && (
              <MessageFooter className="px-0 text-[10px] text-[#4D8EFF]">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block size-3 rounded-full border border-[#4D8EFF]" />
                  Read
                </span>
              </MessageFooter>
            )}
          </MessageContent>
        </Message>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete message?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the message for everyone in the
                channel.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMessage.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteMessage.isPending}
              >
                {deleteMessage.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Message align="start" className="gap-2.5">
      {avatar}
      <MessageContent>
        <MessageHeader className="gap-1.5 px-0 text-xs text-[#8A8A8A]">
          <span className="font-semibold text-white">{authorName}</span>
          <span>
            {formatTime(message.createdAt)}
            {editedSuffix}
          </span>
        </MessageHeader>

        <Bubble variant="ghost" align="start" className="max-w-full">
          <BubbleContent className="text-sm leading-relaxed whitespace-pre-wrap text-[#E5E5E5]">
            {message.body}
          </BubbleContent>
        </Bubble>

        {message.embeds && message.embeds.length > 0 && (
          <div className="flex flex-col gap-2">
            {message.embeds.map((embed) => (
              <EmbedCard key={embed.url} embed={embed} />
            ))}
          </div>
        )}

        {reactionBar}
      </MessageContent>
    </Message>
  );
}
