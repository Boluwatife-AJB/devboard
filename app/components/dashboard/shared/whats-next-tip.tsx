"use client";

import { LightbulbIcon } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";

type WhatsNextTipProps = {
  tip: string;
};

export function WhatsNextTip({ tip }: WhatsNextTipProps) {
  return (
    <Card className="rounded-xs border-devboard-primary/20 bg-devboard-primary/5">
      <CardContent className="flex items-start gap-3 py-4">
        <LightbulbIcon className="mt-0.5 size-5 shrink-0 text-devboard-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">What&apos;s next</p>
          <p className="text-sm text-muted-foreground">{tip}</p>
        </div>
      </CardContent>
    </Card>
  );
}
