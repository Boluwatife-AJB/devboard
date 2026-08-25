"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuickAction } from "@/types";

type MemberQuickActionsCardProps = {
  actions: QuickAction[];
  unreadMessages?: number;
};

export function MemberQuickActionsCard({
  actions,
  unreadMessages = 2,
}: MemberQuickActionsCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="sr-only">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 py-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const showBadge = action.id === "messages" && unreadMessages > 0;

          return (
            <Button
              key={action.id}
              variant="ghost"
              className="h-10 w-full justify-start rounded-xs px-3"
              render={<Link href={action.href} />}
            >
              <Icon data-icon="inline-start" />
              <span className="flex-1 text-left">{action.label}</span>
              {showBadge && (
                <Badge className="ml-auto size-5 justify-center rounded-xs p-0">
                  {unreadMessages}
                </Badge>
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
