import { EmbedCard } from "@/components/messages/embed-card";
import { SquareAvatar } from "@/components/messages/square-avatar";
import { formatTime } from "@/lib/message-utils";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";
import type { DisplayMessage } from "@/types";

export function MessageBubble({
  message,
  authorName,
  isSelf,
}: {
  message: DisplayMessage;
  authorName: string;
  isSelf: boolean;
}) {
  const editedSuffix = message.isEdited ? " (edited)" : "";

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
        </div>
      </div>
    </div>
  );
}
