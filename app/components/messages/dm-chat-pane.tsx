"use client";

import { useEffect, useRef, useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useClearDmMessages,
  useDmMessages,
  useMarkDmAsRead,
  useSendDm,
} from "@/hooks/use-messaging";
import { useDmReceivedEvents } from "@/hooks/use-messaging-events";
import { getApiErrorMessage } from "@/lib/api";
import type { ApiDmThread, ApiUser, UiPresence } from "@/types";

export function DmChatPane({
  thread,
  me,
  displayNameOf,
  presenceOf,
}: {
  thread: ApiDmThread;
  me: ApiUser | undefined;
  displayNameOf: (userId: string) => string;
  presenceOf: (userId: string) => UiPresence;
}) {
  const otherUserId =
    thread.participantA === me?.id ? thread.participantB : thread.participantA;
  const otherName = displayNameOf(otherUserId);

  const { data: messages = [], isLoading, error } = useDmMessages(thread.id);
  useDmReceivedEvents(thread.id);
  const sendDm = useSendDm(thread.id);
  const markAsRead = useMarkDmAsRead();
  const clearMessages = useClearDmMessages(thread.id);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (lastMessageId) {
      markAsRead.mutate(thread.id);
    }
  }, [thread.id, lastMessageId, markAsRead.mutate]);

  useEffect(() => {
    if (!lastMessageId) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0B0E14]">
      <ChatHeader
        title={otherName}
        subtitle={
          presenceOf(otherUserId) === "online"
            ? "Online"
            : presenceOf(otherUserId) === "away"
              ? "Away"
              : "Offline"
        }
        onClearMessages={() => setClearOpen(true)}
        clearPending={clearMessages.isPending}
      />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear messages?</AlertDialogTitle>
            <AlertDialogDescription>
              This hides the conversation history for you. {otherName} will
              still see the messages. New messages will still appear.
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

      <ScrollArea className="max-h-[calc(100vh-23rem)] flex-1">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          emptyMessage={`This is the beginning of your conversation with ${otherName}.`}
          myUserId={me?.id}
          displayNameOf={displayNameOf}
          bottomRef={bottomRef}
          threadId={thread.id}
        />
      </ScrollArea>

      <MessageComposer
        key={thread.id}
        channelName={otherName}
        onSend={(_html, text) => {
          sendDm.mutate(
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
