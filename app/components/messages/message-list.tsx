import type { RefObject } from "react";
import { MessageBubble } from "@/components/messages/message-bubble";
import { Skeleton } from "@/components/ui/skeleton";
import { groupMessagesByDay } from "@/lib/message-utils";
import type { DisplayMessage } from "@/types";

export function MessageList({
  messages,
  isLoading,
  error,
  emptyMessage,
  myUserId,
  displayNameOf,
  bottomRef,
  channelId,
  canReact = false,
}: {
  messages: DisplayMessage[];
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  myUserId: string | undefined;
  displayNameOf: (userId: string) => string;
  bottomRef: RefObject<HTMLDivElement | null>;
  channelId?: string;
  canReact?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-6">
        {["a", "b", "c"].map((key) => (
          <div key={key} className="flex gap-3">
            <Skeleton className="size-7 rounded-xs bg-[#1C1B1B]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32 rounded-xs bg-[#1C1B1B]" />
              <Skeleton className="h-4 w-2/3 rounded-xs bg-[#1C1B1B]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-6">
        <div className="text-center">
          <p className="text-sm text-[#FF6B6B]">Failed to load messages.</p>
          <p className="mt-1 text-xs text-[#8A8A8A]">{error.message}</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-6">
        <p className="text-sm text-[#8A8A8A]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6">
      {groupMessagesByDay(messages).map((group) => (
        <div key={group.label} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#2A2A2A]" />
            <span className="text-xs text-[#8A8A8A]">{group.label}</span>
            <div className="h-px flex-1 bg-[#2A2A2A]" />
          </div>
          {group.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              authorName={displayNameOf(message.authorId)}
              isSelf={message.authorId === myUserId}
              channelId={channelId}
              canReact={canReact}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
