"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatHeader } from "@/components/messages/chat-header";
import { MessageComposer } from "@/components/messages/message-composer";
import { MessageList } from "@/components/messages/message-list";
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useChannelMembers,
  useChannelMessages,
  useClearChannelMessages,
  useJoinChannel,
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
  const isMember = channel.isMember;
  const {
    data: messages = [],
    isLoading,
    error,
  } = useChannelMessages(isMember ? channel.id : "");
  useChannelMessageEvents(isMember ? channel.id : "");
  const { data: channelMembers = [] } = useChannelMembers(
    isMember ? channel.id : "",
  );
  const sendMessage = useSendMessage(channel.id);
  const joinChannel = useJoinChannel();
  const markAsRead = useMarkChannelAsRead();
  const clearMessages = useClearChannelMessages(channel.id);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const mentionCandidates = useMemo(
    () =>
      channelMembers
        .filter((member) => member.userId !== me?.id)
        .map((member) => ({
          id: member.userId,
          displayName: member.user?.displayName ?? displayNameOf(member.userId),
        })),
    [channelMembers, displayNameOf, me?.id],
  );

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (!isMember || !lastMessageId) return;
    markAsRead.mutate({ channelId: channel.id, lastMessageId });
  }, [channel.id, isMember, lastMessageId, markAsRead.mutate]);

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
        onClearMessages={isMember ? () => setClearOpen(true) : undefined}
        clearPending={clearMessages.isPending}
      />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear messages?</AlertDialogTitle>
            <AlertDialogDescription>
              This hides the message history for you in #{channel.slug}. Other
              members will still see the messages. New messages will still
              appear.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearMessages.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                clearMessages.mutate(undefined, {
                  onSuccess: () => setClearOpen(false),
                  onError: (clearError) =>
                    toast.error(getApiErrorMessage(clearError)),
                })
              }
              disabled={clearMessages.isPending}
            >
              {clearMessages.isPending ? "Clearing…" : "Clear messages"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMember ? (
        <>
          <ScrollArea className="max-h-[calc(100vh-23rem)] flex-1">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              error={error}
              emptyMessage={`No messages yet in #${channel.slug}. Say hello!`}
              myUserId={me?.id}
              displayNameOf={displayNameOf}
              bottomRef={bottomRef}
              channelId={channel.id}
              canReact
            />
          </ScrollArea>

          <MessageComposer
            key={channel.id}
            channelName={channel.name}
            mentionCandidates={mentionCandidates}
            onSend={(html, text) => {
              if (!text.trim()) return;
              sendMessage.mutate(
                { body: html },
                {
                  onError: (sendError) =>
                    toast.error(getApiErrorMessage(sendError)),
                },
              );
            }}
          />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="space-y-2">
            <p className="text-sm text-[#E5E5E5]">
              You&apos;re not a member of #{channel.slug}
            </p>
            <p className="text-xs text-[#8A8A8A]">
              Join this channel to read messages and take part in the
              conversation.
            </p>
          </div>
          <Button
            type="button"
            disabled={joinChannel.isPending}
            onClick={() => {
              joinChannel.mutate(channel.id, {
                onError: (joinError) =>
                  toast.error(getApiErrorMessage(joinError)),
              });
            }}
          >
            {joinChannel.isPending ? "Joining…" : `Join #${channel.slug}`}
          </Button>
        </div>
      )}
    </section>
  );
}
