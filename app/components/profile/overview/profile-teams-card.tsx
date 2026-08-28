"use client";

import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProfileTeam } from "@/types";

type ProfileTeamsCardProps = {
  teams: ProfileTeam[];
};

export function ProfileTeamsCard({ teams }: ProfileTeamsCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <UsersThreeIcon className="size-4" />
          Teams & Guilds
        </CardTitle>
        <CardAction>
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground"
            render={<Link href="/teams" />}
          >
            View All
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {teams.map((team) => {
            const Icon = team.icon;
            return (
              <div
                key={team.id}
                className="flex items-start gap-3 rounded-xs bg-muted/20 p-4 ring-1 ring-foreground/5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-muted/60 text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-medium text-foreground">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.memberCount} Members • {team.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
