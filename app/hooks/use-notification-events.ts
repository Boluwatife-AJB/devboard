"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { ANNOUNCEMENT_RECEIVED_SUBSCRIPTION } from "@/lib/graphql/documents";
import { getWsClient } from "@/lib/graphql/ws";
import { navigateToActionUrl } from "@/lib/notification-utils";
import type { ApiNotification } from "@/types";
import { useMe } from "./use-me";
import { notificationKeys } from "./use-notifications";

export function useNotificationEvents() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: me } = useMe();

  useEffect(() => {
    if (!me?.id) return;

    const dispose = getWsClient().subscribe<{
      announcementReceived: ApiNotification;
    }>(
      { query: ANNOUNCEMENT_RECEIVED_SUBSCRIPTION },
      {
        next: (result) => {
          const notification = result.data?.announcementReceived;
          if (!notification) return;

          toast(notification.title, {
            description: notification.body ?? undefined,
            action: notification.actionUrl
              ? {
                  label: "Open",
                  onClick: () =>
                    navigateToActionUrl(notification.actionUrl, router.push),
                }
              : undefined,
          });

          queryClient.setQueriesData<ApiNotification[]>(
            { queryKey: notificationKeys.all },
            (notifications) => {
              if (!notifications) return [notification];
              if (notifications.some((item) => item.id === notification.id)) {
                return notifications;
              }
              return [notification, ...notifications];
            },
          );

          if (!notification.isRead) {
            queryClient.setQueryData<number>(
              notificationKeys.unreadCount,
              (count) => (count ?? 0) + 1,
            );
          }
        },
        error: (error) => {
          console.warn("notification subscription error", error);
        },
        complete: () => {},
      },
    );

    return dispose;
  }, [me?.id, queryClient, router]);
}
