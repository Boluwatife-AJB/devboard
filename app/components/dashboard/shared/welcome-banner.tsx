"use client";

import { HandWavingIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";

type WelcomeBannerProps = {
  organizationName?: string;
};

export function WelcomeBanner({ organizationName }: WelcomeBannerProps) {
  return (
    <Card className="rounded-xs border-devboard-primary/30 bg-devboard-primary/10">
      <CardContent className="flex items-start gap-3 py-4">
        <HandWavingIcon className="mt-0.5 size-5 shrink-0 text-devboard-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">
            You&apos;ve joined {organizationName ?? "the workspace"}
          </p>
          <p className="text-sm text-muted-foreground">
            Use the checklist below to get oriented. Your dashboard will fill in
            as your team adds projects and assigns work.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
