"use client";

import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuickAction } from "@/types";

type AdminQuickActionsCardProps = {
  actions: QuickAction[];
};

function ActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  const trigger = (
    <Button variant="outline" size="sm" className="rounded-xs">
      <Icon data-icon="inline-start" />
      {action.label}
    </Button>
  );

  if (action.id === "create-project") {
    return <CreateProjectDialog trigger={trigger} />;
  }
  if (action.id === "invite-member") {
    return <InviteMemberDialog trigger={trigger} />;
  }
  if (action.id === "create-team") {
    return <CreateTeamDialog trigger={trigger} />;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xs"
      render={<Link href={action.href} />}
    >
      <Icon data-icon="inline-start" />
      {action.label}
    </Button>
  );
}

export function AdminQuickActionsCard({ actions }: AdminQuickActionsCardProps) {
  return (
    <Card className="rounded-xs py-3">
      <CardHeader className="flex flex-row items-center gap-3 border-0 px-4 py-0">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <LightningIcon className="size-4" />
          Quick Actions
        </CardTitle>
        <CardContent className="flex flex-1 flex-wrap items-center gap-2 p-0">
          {actions.map((action) => (
            <ActionButton key={action.id} action={action} />
          ))}
        </CardContent>
      </CardHeader>
    </Card>
  );
}
