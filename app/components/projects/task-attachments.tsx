"use client";

import {
  GithubLogoIcon,
  GitPullRequestIcon,
  LinkSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { useAttachments } from "@/hooks/use-attachments";
import type { AttachmentKind } from "@/types";

const KIND_ICON: Record<AttachmentKind, typeof LinkSimpleIcon> = {
  LINK: LinkSimpleIcon,
  GITHUB_ISSUE: GithubLogoIcon,
  GITHUB_PR: GitPullRequestIcon,
};

export function TaskAttachments({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const { data: attachments, isPending } = useAttachments(projectId, taskId);

  return (
    <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
      <CardContent className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold text-white">Technical Context</h2>

        {isPending && <p className="text-xs text-[#8A8A8A]">Loading…</p>}

        {!isPending && (attachments?.length ?? 0) === 0 && (
          <p className="text-sm italic text-[#8A8A8A]">No links attached.</p>
        )}

        <div className="flex flex-col gap-2">
          {attachments?.map((attachment) => {
            const Icon = KIND_ICON[attachment.kind] ?? LinkSimpleIcon;
            return (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xs border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 transition-colors hover:border-[#4D8EFF66]"
              >
                <Icon className="size-4 shrink-0 text-[#4D8EFF]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">
                    {attachment.label}
                  </p>
                  <p className="truncate text-xs font-mono text-[#8A8A8A]">
                    {attachment.url}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
