import { UserPlusIcon } from "@phosphor-icons/react/dist/ssr";
import { MembersTable } from "@/components/settings/members-table";
import { Button } from "@/components/ui/button";

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
        <Button className="uppercase">
          <UserPlusIcon data-icon="inline-start" weight="bold" />
          Invite Member
        </Button>
      </div>
      <MembersTable />
    </div>
  );
}
