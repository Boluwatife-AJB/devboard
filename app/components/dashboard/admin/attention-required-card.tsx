"use client";

import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AttentionItem } from "@/types";

type AttentionRequiredCardProps = {
  items: AttentionItem[];
};

export function AttentionRequiredCard({ items }: AttentionRequiredCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <WarningCircleIcon className="size-4 text-muted-foreground" />
          Attention Required
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-0 pt-0">
        {items.map((item, index) => (
          <div key={item.id}>
            {index > 0 && <Separator />}
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0">
                {item.actionLabel}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
