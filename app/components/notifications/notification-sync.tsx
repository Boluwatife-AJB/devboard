"use client";

import { useNotificationEvents } from "@/hooks/use-notification-events";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function NotificationSync() {
  useNotificationEvents();
  useUnreadNotificationCount();
  return null;
}
