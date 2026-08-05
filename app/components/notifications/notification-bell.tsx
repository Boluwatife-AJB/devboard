"use client";

import { BellIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import {
  formatNotificationPreview,
  navigateToActionUrl,
} from "@/lib/notification-utils";
import { formatRelativeTime } from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type { ApiNotification } from "@/types";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useNotifications(false, 20);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const count = unreadCount ?? 0;

  async function handleOpenNotification(notification: ApiNotification) {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    setOpen(false);
    navigateToActionUrl(notification.actionUrl, router.push);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "relative inline-flex size-5 items-center justify-center",
              className,
            )}
            aria-label={
              count > 0 ? `${count} unread notifications` : "Notifications"
            }
          >
            <BellIcon className="size-5 text-on-surface-variant transition-colors hover:text-on-surface" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4D8EFF] px-1 text-[10px] font-semibold leading-none text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-96 border border-[#2A2A2A] bg-[#131313] p-0 text-on-surface shadow-lg"
      >
        <PopoverHeader className="flex flex-row items-center justify-between gap-2 border-b border-[#2A2A2A] px-3 py-2.5">
          <PopoverTitle className="text-sm font-semibold text-white">
            Notifications
          </PopoverTitle>
          {count > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-auto px-1.5 py-0.5 text-[11px] text-[#4D8EFF] hover:bg-transparent hover:text-[#4D8EFF]/90"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </PopoverHeader>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="size-5 text-[#8A8A8A]" />
            </div>
          ) : isError ? (
            <div className="px-3 py-6 text-center text-xs text-[#FF6B6B]">
              {error instanceof Error
                ? error.message
                : "Failed to load notifications"}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-10 text-center text-xs text-[#8A8A8A]">
              You&apos;re all caught up
            </div>
          ) : (
            <ul className="divide-y divide-[#2A2A2A]">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-[#1C1B1B]",
                      !notification.isRead && "bg-[#4D8EFF0D]",
                    )}
                    onClick={() => void handleOpenNotification(notification)}
                  >
                    {!notification.isRead ? (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#4D8EFF]" />
                    ) : (
                      <span className="mt-1.5 size-1.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm text-white",
                          !notification.isRead && "font-medium",
                        )}
                      >
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#8A8A8A]">
                          {formatNotificationPreview(notification.body)}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-[#5A5A5A]">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
