"use client";

import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialsOf } from "@/lib/task-ui";

type AvatarCardProps = {
  displayName: string;
  avatarUrl?: string;
};

export function AvatarCard({ displayName, avatarUrl }: AvatarCardProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Avatar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
        <Avatar className="size-24 rounded-xs after:rounded-xs">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="rounded-xs bg-devboard-primary/20 font-heading text-xl text-devboard-primary">
            {initialsOf(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-3">
          <p className="max-w-md text-sm text-muted-foreground">
            Upload a new avatar. Larger images will be resized to 256×256
            pixels. Max file size 2MB.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xs"
              onClick={() =>
                toast.message("Avatar upload", {
                  description: "File upload will be available soon.",
                })
              }
            >
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xs text-destructive hover:text-destructive"
              onClick={() =>
                toast.message("Avatar removed", {
                  description: "Your avatar has been reset.",
                })
              }
            >
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
