"use client";

import {
  ArrowRightIcon,
  ChatsCircleIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appMapSteps } from "@/lib/dashboard/getting-started-config";

const stepIcons = [UsersThreeIcon, SquaresFourIcon, ChatsCircleIcon] as const;

export function AppMapCard() {
  return (
    <Card className="rounded-xs">
      <CardHeader>
        <CardTitle className="text-base text-white">
          How DevBoard works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appMapSteps.map((step, index) => {
          const Icon = stepIcons[index] ?? SquaresFourIcon;

          return (
            <div key={step.title} className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-white">{step.title}</p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 rounded-xs border border-dashed border-devboard-primary/30 bg-devboard-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <ArrowRightIcon className="size-4 shrink-0 text-devboard-primary" />
          Use the sidebar to jump between Projects, Teams, Messages, and
          Settings.
        </div>
      </CardContent>
    </Card>
  );
}
