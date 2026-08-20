"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getSelectedOrgId } from "@/lib/auth/cookies";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  MARK_NOTIFICATION_READ_MUTATION,
  NOTIFICATIONS_QUERY,
  UNREAD_NOTIFICATION_COUNT_QUERY,
} from "@/lib/graphql/documents";
import type { ApiNotification } from "@/types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly: boolean, limit: number) =>
    ["notifications", unreadOnly, limit] as const,
  unreadCount: ["unreadNotificationCount"] as const,
};

export function useNotifications(unreadOnly = false, limit = 20) {
  return useQuery({
    queryKey: notificationKeys.list(unreadOnly, limit),
    queryFn: async () => {
      const data = await graphqlRequest<{ notifications: ApiNotification[] }>(
        NOTIFICATIONS_QUERY,
        { unreadOnly, limit },
      );
      return data.notifications;
    },
    enabled: Boolean(getAccessToken() && getSelectedOrgId()),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const data = await graphqlRequest<{ unreadNotificationCount: number }>(
        UNREAD_NOTIFICATION_COUNT_QUERY,
      );
      return data.unreadNotificationCount;
    },
    enabled: Boolean(getAccessToken() && getSelectedOrgId()),
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const data = await graphqlRequest<{ markNotificationRead: boolean }>(
        MARK_NOTIFICATION_READ_MUTATION,
        { notificationId },
      );
      return data.markNotificationRead;
    },
    onSuccess: (_data, notificationId) => {
      queryClient.setQueriesData<ApiNotification[]>(
        { queryKey: notificationKeys.all },
        (notifications) =>
          notifications?.map((item) =>
            item.id === notificationId ? { ...item, isRead: true } : item,
          ),
      );
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const data = await graphqlRequest<{ markAllNotificationsRead: number }>(
        MARK_ALL_NOTIFICATIONS_READ_MUTATION,
      );
      return data.markAllNotificationsRead;
    },
    onSuccess: () => {
      queryClient.setQueriesData<ApiNotification[]>(
        { queryKey: notificationKeys.all },
        (notifications) =>
          notifications?.map((item) => ({ ...item, isRead: true })),
      );
      queryClient.setQueryData(notificationKeys.unreadCount, 0);
    },
  });
}
