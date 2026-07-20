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
  ApiDmMessage,
  ApiMessage,
  ApiMessageEvent,
  ApiUserPresence,
} from "@/types";
import { messagingKeys } from "./use-messaging";

/**
 * Subscribes to live channel message events and keeps the React Query
 * channel-message cache in sync (same pattern as useTaskEvents).
 */
export function useChannelMessageEvents(channelId: string) {
  const queryClient = useQueryClient();

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

          if (kind === "DELETED") {
            queryClient.setQueryData<ApiMessage[]>(listKey, (messages) =>
              messages?.filter((message) => message.id !== event.messageId),
            );
            return;
          }

          const message = event.message;
          if (!message) return;

          queryClient.setQueryData<ApiMessage[]>(listKey, (messages) => {
            if (!messages) return [message];
            const exists = messages.some((item) => item.id === message.id);
            if (kind === "EDITED" || exists) {
              return messages.map((item) =>
                item.id === message.id ? message : item,
              );
            }
            return [...messages, message];
          });
        },
        error: (error) => {
          console.warn("channel message subscription error", error);
        },
        complete: () => {},
      },
    );

    return dispose;
  }, [channelId, queryClient]);
}

/**
 * Subscribes to new DM messages for a thread.
 */
export function useDmReceivedEvents(threadId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!threadId) return;

    const listKey = messagingKeys.dmMessages(threadId);

    const dispose = getWsClient().subscribe<{ dmReceived: ApiDmMessage }>(
      {
        query: DM_RECEIVED_SUBSCRIPTION,
        variables: { threadId },
      },
      {
        next: (result) => {
          const message = result.data?.dmReceived;
          if (!message) return;

          queryClient.setQueryData<ApiDmMessage[]>(listKey, (messages) => {
            if (!messages) return [message];
            const exists = messages.some((item) => item.id === message.id);
            return exists
              ? messages.map((item) =>
                  item.id === message.id ? message : item,
                )
              : [...messages, message];
          });
        },
        error: (error) => {
          console.warn("dm received subscription error", error);
        },
        complete: () => {},
      },
    );

    return dispose;
  }, [threadId, queryClient]);
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
