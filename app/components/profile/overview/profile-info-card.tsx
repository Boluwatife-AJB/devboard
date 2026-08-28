"use client";

import {
  BriefcaseIcon,
  BuildingsIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { initialsOf } from "@/lib/task-ui";

type ProfileInfoCardProps = {
  firstName: string;
  lastName: string;
  handle: string;
  role: string;
  team: string;
  location: string;
  avatarUrl?: string;
};

const detailItems = [
  { key: "role", icon: BriefcaseIcon, label: "Role" },
  { key: "team", icon: BuildingsIcon, label: "Team" },
  { key: "location", icon: MapPinIcon, label: "Location" },
] as const;

export function ProfileInfoCard({
  firstName,
  lastName,
  handle,
  role,
  team,
  location,
  avatarUrl,
}: ProfileInfoCardProps) {
  const fullName = `${firstName} ${lastName}`;
  const values = { role, team, location };

  return (
    <Card className="rounded-xs">
      <CardContent className="flex flex-col items-center gap-6 pt-6">
        <div className="relative">
          <Avatar className="size-28 rounded-xs after:rounded-xs">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
            <AvatarFallback className="rounded-xs bg-devboard-primary/20 font-heading text-2xl text-devboard-primary">
              {initialsOf(fullName)}
            </AvatarFallback>
          </Avatar>
          <AvatarBadge className="size-3.5 bg-primary ring-card" />
        </div>

        <div className="flex w-full flex-col items-center gap-1 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {fullName}
          </h2>
          <p className="text-sm text-devboard-primary">@{handle}</p>
        </div>

        <div className="flex w-full flex-col gap-4">
          {detailItems.map(({ key, icon: Icon, label }) => (
            <div key={key} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-muted/60 text-muted-foreground">
                <Icon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
                <span className="text-sm text-foreground">{values[key]}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
