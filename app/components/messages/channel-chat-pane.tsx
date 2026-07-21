"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ChatHeader } from "@/components/messages/chat-header";
import { MessageComposer } from "@/components/messages/message-composer";
import { MessageList } from "@/components/messages/message-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useChannelMessages,
  useMarkChannelAsRead,
  useSendMessage,
} from "@/hooks/use-messaging";
import { useChannelMessageEvents } from "@/hooks/use-messaging-events";
import { getApiErrorMessage } from "@/lib/api";
import type { ApiChannel, ApiUser } from "@/types";

export function ChannelChatPane({
  channel,
  me,
  displayNameOf,
  detailsOpen,
  onToggleDetails,
}: {
  channel: ApiChannel;
  me: ApiUser | undefined;
  displayNameOf: (userId: string) => string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const {
    data: messages = [],
    isLoading,
    error,
  } = useChannelMessages(channel.id);
  useChannelMessageEvents(channel.id);
  const sendMessage = useSendMessage(channel.id);
  const markAsRead = useMarkChannelAsRead();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (lastMessageId) {
      markAsRead.mutate({ channelId: channel.id, lastMessageId });
    }
  }, [channel.id, lastMessageId, markAsRead.mutate]);

  useEffect(() => {
    if (!lastMessageId) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0B0E14]">
      <ChatHeader
        title={`# ${channel.slug}`}
        subtitle={channel.description ?? `#${channel.slug}`}
        detailsOpen={detailsOpen}
        onToggleDetails={onToggleDetails}
        kind={channel.kind}
      />

      <ScrollArea className="max-h-[calc(100vh-23rem)] flex-1">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          emptyMessage={`No messages yet in #${channel.slug}. Say hello!`}
          myUserId={me?.id}
          displayNameOf={displayNameOf}
          bottomRef={bottomRef}
        />
      </ScrollArea>

      <MessageComposer
        key={channel.id}
        channelName={channel.name}
        onSend={(_html, text) => {
          sendMessage.mutate(
            { body: text },
            {
              onError: (sendError) =>
                toast.error(getApiErrorMessage(sendError)),
            },
          );
        }}
      />
    </section>
  );
}
