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
    <Button
      variant="ghost"
      className="h-10 w-full justify-start rounded-xs px-3"
    >
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
      variant="ghost"
      className="h-10 w-full justify-start rounded-xs px-3"
      render={<Link href={action.href} />}
    >
      <Icon data-icon="inline-start" />
      {action.label}
    </Button>
  );
}

export function AdminQuickActionsCard({ actions }: AdminQuickActionsCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <LightningIcon className="size-4 text-muted-foreground" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-2">
        {actions.map((action) => (
          <ActionButton key={action.id} action={action} />
        ))}
      </CardContent>
    </Card>
  );
}
