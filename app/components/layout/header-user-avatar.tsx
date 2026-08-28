"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";

export function HeaderUserAvatar() {
  const { data: me, isPending } = useMe();

  if (isPending) {
    return <Skeleton className="size-9 rounded-full" />;
  }

  const displayName = me?.displayName?.trim() || "User";
  const avatarUrl = me?.avatarUrl?.trim();

  return (
    <Avatar>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
      <AvatarFallback
        className="text-xs font-medium text-white"
        style={{ backgroundColor: avatarColorOf(me?.id ?? displayName) }}
      >
        {initialsOf(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
