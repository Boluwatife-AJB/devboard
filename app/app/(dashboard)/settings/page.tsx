import { UserPlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Can } from "@/components/providers/can";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { MembersTable } from "@/components/settings/members-table";
import { Button } from "@/components/ui/button";
import { Action } from "@/lib/rbac/actions";

export default function Settings() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who has access to this workspace and their permission levels.
          </p>
        </div>
        <Can action={Action.InviteOrgMember}>
          <InviteMemberDialog
            trigger={
              <Button className="uppercase">
                <UserPlusIcon data-icon="inline-start" weight="bold" />
                Invite Member
              </Button>
            }
          />
        </Can>
      </div>
      <MembersTable />
    </div>
  );
}
