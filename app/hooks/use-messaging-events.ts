"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CHANNEL_MESSAGES_SUBSCRIPTION,
  DM_RECEIVED_SUBSCRIPTION,
  PRESENCE_SUBSCRIPTION,
} from "@/lib/graphql/documents";
import { getWsClient } from "@/lib/graphql/ws";
import type {
  ApiChannel,
  ApiDmMessage,
  ApiDmMessageEvent,
  ApiDmThread,
  ApiMessage,
  ApiMessageEvent,
  ApiUserPresence,
} from "@/types";
import { useMe } from "./use-me";
import { messagingKeys } from "./use-messaging";

/**
 * Subscribes to live channel message events and keeps the React Query
 * channel-message cache in sync (same pattern as useTaskEvents).
 */
export function useChannelMessageEvents(channelId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  useEffect(() => {
    if (!channelId) return;

    const listKey = messagingKeys.channelMessages(channelId);

    const dispose = getWsClient().subscribe<{
      channelMessages: ApiMessageEvent;
    }>(
      {
        query: CHANNEL_MESSAGES_SUBSCRIPTION,
        variables: { channelId },
      },
      {
        next: (result) => {
          const event = result.data?.channelMessages;
          if (!event) return;

          const kind = event.kind.toUpperCase();
          if (!me?.id) return;

          if (kind === "DELETED") {
            queryClient.setQueryData<ApiMessage[]>(listKey, (messages) =>
              messages?.filter((message) => message.id !== event.messageId),
            );
            return;
          }

          if (kind === "REACTIONS") {
            void queryClient.invalidateQueries({ queryKey: listKey });
            return;
          }

          const message = event.message;
          if (!message) return;

          queryClient.setQueryData<ApiMessage[]>(listKey, (messages) => {
            if (!messages) return [message];
            const exists = messages.some((item) => item.id === message.id);
            if (kind === "EDITED" || exists) {
              return messages.map((item) =>
                item.id === message.id
                  ? {
                      ...item,
                      ...message,
                      reactions: message.reactions ?? item.reactions,
                    }
                  : item,
              );
            }
            return [...messages, message];
          });
          if (kind === "NEW" && message.authorId !== me.id) {
            queryClient.setQueryData<ApiChannel[]>(
              messagingKeys.channels,
              (channels) =>
                channels?.map((c) =>
                  c.id === channelId
                    ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1 }
                    : c,
                ),
            );
          }
        },
        error: (error) => {
          console.warn("channel message subscription error", error);
        },
        complete: () => {},
      },
    );

    return dispose;
  }, [channelId, queryClient, me?.id]);
}

/**
 * Subscribes to DM thread events (new, edited, deleted).
 */
export function useDmReceivedEvents(threadId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  useEffect(() => {
    if (!threadId) return;

    const listKey = messagingKeys.dmMessages(threadId);

    const dispose = getWsClient().subscribe<{
      dmReceived: ApiDmMessageEvent;
    }>(
      {
        query: DM_RECEIVED_SUBSCRIPTION,
        variables: { threadId },
      },
      {
        next: (result) => {
          const event = result.data?.dmReceived;
          if (!event) return;

          const kind = event.kind.toUpperCase();

          if (kind === "DELETED") {
            queryClient.setQueryData<ApiDmMessage[]>(listKey, (messages) =>
              messages?.filter((message) => message.id !== event.messageId),
            );
            return;
          }

          const message = event.message;
          if (!message) return;

          queryClient.setQueryData<ApiDmMessage[]>(listKey, (messages) => {
            if (!messages) return [message];
            const exists = messages.some((item) => item.id === message.id);
            if (kind === "EDITED" || exists) {
              return messages.map((item) =>
                item.id === message.id ? message : item,
              );
            }
            return [...messages, message];
          });

          if (kind === "NEW" && me?.id && message.authorId !== me.id) {
            queryClient.setQueryData<ApiDmThread[]>(
              messagingKeys.dmThreads,
              (threads) =>
                threads?.map((thread) =>
                  thread.id === threadId
                    ? {
                        ...thread,
                        unreadCount: (thread.unreadCount ?? 0) + 1,
                      }
                    : thread,
                ),
            );
          }
        },
        error: (error) => {
          console.warn("dm received subscription error", error);
        },
        complete: () => {},
      },
    );

    return dispose;
  }, [threadId, queryClient, me?.id]);
}

/**
 * Subscribes to org presence updates. Caller can pass an optional handler
 * or read from a dedicated presence query key later.
 */
export function usePresenceEvents(
  onPresence?: (presence: ApiUserPresence) => void,
) {
  useEffect(() => {
    const dispose = getWsClient().subscribe<{ presence: ApiUserPresence }>(
      {
        query: PRESENCE_SUBSCRIPTION,
      },
      {
        next: (result) => {
          const presence = result.data?.presence;
          if (!presence) return;
          onPresence?.(presence);
        },
        error: (error) => {
          console.warn("presence subscription error", error);
        },
        complete: () => {},
      },
    );

    return dispose;
  }, [onPresence]);
}
