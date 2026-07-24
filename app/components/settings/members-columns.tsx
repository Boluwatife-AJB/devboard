"use client";

import { DotsThreeVerticalIcon } from "@phosphor-icons/react/dist/ssr";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRevokeInvitation } from "@/hooks/use-invitations";
import { getApiErrorMessage } from "@/lib/api";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type { OrgRole, UiPresence } from "@/types";

export type MemberRow = {
  kind: "member" | "invite";
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  status: UiPresence | "pending";
  inviteUrl?: string;
};

export const roleLabels: Record<OrgRole, string> = {
  ORG_OWNER: "Owner",
  ORG_ADMIN: "Admin",
  ORG_MEMBER: "Member",
};

export const membersColumns: ColumnDef<MemberRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    filterFn: (row, _columnId, filterValue: string) => {
      const query = filterValue.toLowerCase();
      return (
        row.original.name.toLowerCase().includes(query) ||
        row.original.email.toLowerCase().includes(query)
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-3 py-1">
        <Avatar className="size-9 rounded-xs">
          <AvatarFallback
            className="rounded-xs text-xs font-semibold text-white"
            style={{ backgroundColor: avatarColorOf(row.original.userId) }}
          >
            {initialsOf(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {row.original.name}
          </p>
          <p className="truncate font-mono text-xs text-[#8A8A8A]">
            {row.original.kind === "invite"
              ? "Invitation pending"
              : row.original.email}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="h-6 rounded-xs border-[#4A4A4A] bg-transparent px-2.5 text-xs text-[#E5E5E5]"
      >
        {roleLabels[row.original.role]}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === "pending") {
        return (
          <Badge
            variant="outline"
            className="h-6 rounded-xs border-[#F59E0B66] bg-transparent px-2.5 text-xs text-[#F59E0B]"
          >
            Pending
          </Badge>
        );
      }
      const online = status === "online";
      const away = status === "away";
      return (
        <span
          className={cn(
            "flex items-center gap-2 text-sm",
            online ? "text-[#E5E5E5]" : "text-[#8A8A8A]",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              online && "bg-[#22C55E]",
              away && "bg-[#F59E0B]",
              !online && !away && "bg-[#6B7280]",
            )}
          />
          {online ? "Online" : away ? "Away" : "Offline"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    enableHiding: false,
    cell: ({ row }) => <MemberActionsCell member={row.original} />,
  },
];

function MemberActionsCell({ member }: { member: MemberRow }) {
  const revokeInvitation = useRevokeInvitation();

  const handleRevoke = async () => {
    try {
      await revokeInvitation.mutateAsync(member.userId);
      toast.success(`Invitation to ${member.email} revoked`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleCopyInviteLink = async () => {
    if (!member.inviteUrl) {
      toast.error("Invite link is unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(member.inviteUrl);
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.error("Could not copy invite link");
    }
  };

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[#C2C6D6] hover:text-white"
              aria-label={`Actions for ${member.name}`}
            >
              <DotsThreeVerticalIcon className="size-4" weight="bold" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(member.email);
                toast.success("Email copied to clipboard");
              }}
            >
              Copy email
            </DropdownMenuItem>
            {member.kind === "member" && (
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(member.userId);
                  toast.success("User ID copied to clipboard");
                }}
              >
                Copy user ID
              </DropdownMenuItem>
            )}
            {member.kind === "invite" && (
              <DropdownMenuItem onClick={handleCopyInviteLink}>
                Copy invite link
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {member.kind === "invite" ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={revokeInvitation.isPending}
              onClick={handleRevoke}
            >
              Revoke invitation
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive">
              Remove member
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
