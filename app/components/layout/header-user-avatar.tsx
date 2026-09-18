"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyOrgProfile } from "@/hooks/use-my-org-profile";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";

export function HeaderUserAvatar() {
  const { data: profile, isPending } = useMyOrgProfile();

  if (isPending) {
    return <Skeleton className="size-9 rounded-full" />;
  }

  const displayName = profile?.displayName?.trim() || "User";
  const avatarUrl = profile?.avatarUrl?.trim();

  return (
    <Avatar>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
      <AvatarFallback
        className="text-xs font-medium text-white"
        style={{
          backgroundColor: avatarColorOf(profile?.userId ?? displayName),
        }}
      >
        {initialsOf(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
