"use client";

import { TrashIcon, UserPlusIcon } from "@phosphor-icons/react/dist/ssr";
import { type ReactElement, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  useAddTeamMember,
  useOrgMembers,
  useRemoveTeamMember,
  useTeamMembers,
} from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";
import type { ApiTeam, TeamRole } from "@/types";

const roleBadgeStyles: Record<TeamRole, string> = {
  OWNER: "border-[#F59E0B33] bg-[#F59E0B1A] text-[#F59E0B]",
  ADMIN: "border-[#4D8EFF33] bg-[#4D8EFF1A] text-[#ADC6FF]",
  MEMBER: "border-[#C2C6D633] bg-[#C2C6D61A] text-[#C2C6D6]",
};

export function ManageMembersDialog({
  team,
  trigger,
}: {
  team: ApiTeam;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<TeamRole>("MEMBER");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const {
    data: members,
    isPending,
    isError,
    error,
  } = useTeamMembers(open ? team.id : "");
  const { data: orgMembers } = useOrgMembers();
  const addMember = useAddTeamMember(team.id);
  const removeMember = useRemoveTeamMember(team.id);

  const availableMembers = (orgMembers ?? []).filter(
    (orgMember) =>
      orgMember.user &&
      !(members ?? []).some((member) => member.userId === orgMember.userId),
  );

  const handleAdd = async () => {
    if (!selectedUserId) return;
    try {
      const member = await addMember.mutateAsync({
        userId: selectedUserId,
        role: selectedRole,
      });
      toast.success(
        `${member.user?.displayName ?? "Member"} added to ${team.name}`,
      );
      setSelectedUserId(null);
      setSelectedRole("MEMBER");
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    setRemovingUserId(userId);
    try {
      await removeMember.mutateAsync(userId);
      toast.success(`${name} removed from ${team.name}`);
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team.name} — Members</DialogTitle>
          <DialogDescription>
            Add or remove people from this team. Team admins can create projects
            for the team.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Add member */}
          <div className="flex items-end gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Add member</span>
              <Select
                value={selectedUserId}
                onValueChange={(value) => setSelectedUserId(value as string)}
              >
                <SelectTrigger
                  className="w-full"
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
                    {availableMembers.length === 0 && (
                      <SelectItem value="__none" disabled>
                        Everyone in the organization is already a member
                      </SelectItem>
                    )}
                    {availableMembers.map((orgMember) => (
                      <SelectItem
                        key={orgMember.userId}
                        value={orgMember.userId}
                      >
                        {orgMember.user?.displayName} ({orgMember.user?.email})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as TeamRole)}
            >
              <SelectTrigger className="w-28" aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              onClick={handleAdd}
              disabled={!selectedUserId || addMember.isPending}
            >
              {addMember.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <UserPlusIcon data-icon="inline-start" />
              )}
              Add
            </Button>
          </div>

          {/* Member list */}
          <div className="flex flex-col gap-2">
            {isPending && (
              <>
                <Skeleton className="h-12 w-full rounded-xs" />
                <Skeleton className="h-12 w-full rounded-xs" />
              </>
            )}

            {isError && (
              <p className="text-sm text-[#FF6B6B]">
                {getApiErrorMessage(error)}
              </p>
            )}

            {members?.length === 0 && (
              <p className="text-sm italic text-muted-foreground">
                No members yet.
              </p>
            )}

            {members?.map((member) => {
              const name = member.user?.displayName ?? "Unknown user";
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-xs border border-[#2A2A2A] bg-[#1C1B1B] p-3"
                >
                  <Avatar className="size-8">
                    <AvatarFallback
                      className="text-[10px] text-white"
                      style={{ backgroundColor: avatarColorOf(member.userId) }}
                    >
                      {initialsOf(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.user?.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`h-5 rounded-xs px-2 text-[10px] font-semibold uppercase ${roleBadgeStyles[member.role]}`}
                  >
                    {member.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-[#FF6B6B] hover:bg-[#FF6B6B1A]"
                    aria-label={`Remove ${name}`}
                    disabled={removingUserId === member.userId}
                    onClick={() => handleRemove(member.userId, name)}
                  >
                    {removingUserId === member.userId ? (
                      <Spinner />
                    ) : (
                      <TrashIcon />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
