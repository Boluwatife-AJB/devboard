"use client";

import Link from "next/link";
import { CreateChannelDialog } from "@/components/messages/create-channel-dialog";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Can } from "@/components/providers/can";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuickStartItem } from "@/lib/dashboard/getting-started-config";

type QuickStartGridProps = {
  items: QuickStartItem[];
  title?: string;
};

function QuickStartCard({ item }: { item: QuickStartItem }) {
  const Icon = item.icon;

  const content = (
    <>
      <div className="flex size-10 items-center justify-center rounded-xs bg-devboard-primary/10 text-devboard-primary">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{item.label}</p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
    </>
  );

  const cardClassName =
    "flex h-full flex-col gap-3 rounded-xs border border-foreground/10 bg-card p-4 text-left transition-colors hover:border-devboard-primary/40 hover:bg-devboard-primary/5";

  if (item.dialogId === "create-project") {
    return (
      <CreateProjectDialog
        trigger={
          <button type="button" className={cardClassName}>
            {content}
          </button>
        }
      />
    );
  }

  if (item.dialogId === "invite-member") {
    return (
      <InviteMemberDialog
        trigger={
          <button type="button" className={cardClassName}>
            {content}
          </button>
        }
      />
    );
  }

  if (item.dialogId === "create-team") {
    return (
      <CreateTeamDialog
        trigger={
          <button type="button" className={cardClassName}>
            {content}
          </button>
        }
      />
    );
  }

  if (item.dialogId === "create-channel") {
    return (
      <CreateChannelDialog
        trigger={
          <button type="button" className={cardClassName}>
            {content}
          </button>
        }
      />
    );
  }

  if (item.href) {
    return (
      <Link href={item.href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClassName} aria-disabled>
      {content}
    </div>
  );
}

function GatedQuickStartCard({ item }: { item: QuickStartItem }) {
  if (!item.action) {
    return <QuickStartCard item={item} />;
  }

  return (
    <Can action={item.action}>
      <QuickStartCard item={item} />
    </Can>
  );
}

export function QuickStartGrid({
  items,
  title = "Quick start",
}: QuickStartGridProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader>
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <GatedQuickStartCard key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
