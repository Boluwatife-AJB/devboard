"use client";

import {
  BellSlashIcon,
  SignOutIcon,
  TrashIcon,
  UserPlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useMe } from "@/hooks/use-me";
import {
  useAddChannelMember,
  useChannelMembers,
  useLeaveChannel,
  useRemoveChannelMember,
} from "@/hooks/use-messaging";
import { useOrgAuthz } from "@/hooks/use-org-authz";
import { useOrgMembers } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { Action } from "@/lib/rbac/actions";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";
import type { ApiChannel } from "@/types";
import { Can } from "../providers/can";

export function DetailsPane({
  channel,
  onLeftChannel,
}: {
  channel: ApiChannel;
  onLeftChannel?: () => void;
}) {
  const { data: me } = useMe();
  const { can } = useOrgAuthz();
  const [canManage, setCanManage] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  useEffect(() => {
    setCanManage(can(Action.ManageChannelMembers));
  }, [can]);

  const {
    data: members = [],
    isPending: membersPending,
    isError: membersError,
  } = useChannelMembers(channel.id);
  const { data: orgMembers = [] } = useOrgMembers();
  const addMember = useAddChannelMember(channel.id);
  const removeMember = useRemoveChannelMember(channel.id);
  const leaveChannel = useLeaveChannel();

  const availableMembers = orgMembers.filter(
    (orgMember) =>
      orgMember.user &&
      !members.some((member) => member.userId === orgMember.userId),
  );

  const handleAdd = async () => {
    if (!selectedUserId) return;
    try {
      await addMember.mutateAsync(selectedUserId);
      const name =
        availableMembers.find((member) => member.userId === selectedUserId)
          ?.user?.displayName ?? "Member";
      toast.success(`${name} added to #${channel.slug}`);
      setSelectedUserId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    setRemovingUserId(userId);
    try {
      await removeMember.mutateAsync(userId);
      toast.success(`${name} removed from #${channel.slug}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveChannel.mutateAsync(channel.id);
      toast.success(`Left #${channel.slug}`);
      onLeftChannel?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <aside className="flex h-full flex-col border-l border-[#2A2A2A] bg-[#131313]">
      <ScrollArea className="max-h-[calc(100vh-12rem)] flex-1">
        <div className="space-y-6 p-5">
          <h3 className="text-sm font-semibold text-white">Channel Details</h3>
          <h2 className="text-xl font-semibold text-white">{channel.name}</h2>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Description
            </p>
            <p className="text-sm leading-relaxed text-[#C2C6D6]">
              {channel.description ?? "No description yet."}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Visibility
            </p>
            <p className="text-sm text-[#C2C6D6]">
              {channel.kind === "PRIVATE"
                ? "Private, invite only"
                : "Open, anyone in the org can join"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Slug
            </p>
            <p className="font-mono text-sm text-[#C2C6D6]">#{channel.slug}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Members
            </p>

            {canManage && (
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    value={selectedUserId}
                    onValueChange={(value) =>
                      setSelectedUserId(value as string)
                    }
                  >
                    <SelectTrigger
                      className="w-full border-[#2A2A2A] bg-[#0B0E14] text-[#C2C6D6]"
                      aria-label="Select a member to add"
                    >
                      <SelectValue>
                        {selectedUserId
                          ? (availableMembers.find(
                              (member) => member.userId === selectedUserId,
                            )?.user?.displayName ?? "Select a person")
                          : "Select a person"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableMembers.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            Everyone is already in this channel
                          </SelectItem>
                        ) : (
                          availableMembers.map((orgMember) => (
                            <SelectItem
                              key={orgMember.userId}
                              value={orgMember.userId}
                            >
                              {orgMember.user?.displayName} (
                              {orgMember.user?.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xs bg-devboard-primary text-white hover:bg-devboard-primary/90"
                  disabled={!selectedUserId || addMember.isPending}
                  onClick={handleAdd}
                >
                  {addMember.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <UserPlusIcon data-icon="inline-start" />
                  )}
                  Add
                </Button>
              </div>
            )}

            {membersPending ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-xs" />
                <Skeleton className="h-10 w-full rounded-xs" />
              </div>
            ) : membersError ? (
              <p className="text-sm text-[#FF6B6B]">
                Could not load channel members.
              </p>
            ) : members.length === 0 ? (
              <p className="text-sm text-[#8A8A8A]">No members yet.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => {
                  const name =
                    member.user?.displayName ?? member.userId.slice(0, 8);
                  const isMe = member.userId === me?.id;
                  return (
                    <li
                      key={member.userId}
                      className="flex items-center gap-3 rounded-xs border border-[#2A2A2A] px-3 py-2"
                    >
                      <Avatar className="size-8 rounded-xs">
                        <AvatarFallback
                          className="rounded-xs text-xs text-white"
                          style={{
                            backgroundColor: avatarColorOf(member.userId),
                          }}
                        >
                          {initialsOf(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">
                          {name}
                          {isMe ? " (you)" : ""}
                        </p>
                        {member.user?.email && (
                          <p className="truncate text-xs text-[#8A8A8A]">
                            {member.user.email}
                          </p>
                        )}
                      </div>
                      <Can action={Action.ManageChannelMembers}>
                        {canManage && !isMe && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-[#8A8A8A] hover:bg-[#FF6B6B1A] hover:text-[#FF6B6B]"
                            disabled={removingUserId === member.userId}
                            onClick={() => handleRemove(member.userId, name)}
                            aria-label={`Remove ${name}`}
                          >
                            {removingUserId === member.userId ? (
                              <Spinner className="size-4" />
                            ) : (
                              <TrashIcon className="size-4" />
                            )}
                          </Button>
                        )}
                      </Can>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t border-[#2A2A2A] p-4">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start rounded-xs text-[#C2C6D6] hover:text-white"
        >
          <BellSlashIcon data-icon="inline-start" className="size-4" />
          Mute Channel
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start rounded-xs text-[#FF6B6B] hover:bg-[#FF6B6B1A] hover:text-[#FF6B6B]"
          disabled={leaveChannel.isPending}
          onClick={handleLeave}
        >
          {leaveChannel.isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <SignOutIcon data-icon="inline-start" className="size-4" />
          )}
          Leave Channel
        </Button>
      </div>
    </aside>
  );
}
