"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppMapCard } from "@/components/dashboard/shared/app-map-card";
import { DashboardGreeting } from "@/components/dashboard/shared/dashboard-greeting";
import { QuickStartGrid } from "@/components/dashboard/shared/quick-start-grid";
import { SetupChecklist } from "@/components/dashboard/shared/setup-checklist";
import { WelcomeBanner } from "@/components/dashboard/shared/welcome-banner";
import { WhatsNextTip } from "@/components/dashboard/shared/whats-next-tip";
import { Button } from "@/components/ui/button";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { useSetupProgress } from "@/hooks/use-setup-progress";
import {
  adminQuickStartItems,
  memberQuickStartItems,
} from "@/lib/dashboard/getting-started-config";
import { getWhatsNextTip } from "@/lib/dashboard/setup-progress";
import type {
  ApiDashboardEmptyState,
  ApiDashboardSetupProgress,
} from "@/types";

type GettingStartedHubProps = {
  persona: "admin" | "member";
  displayName?: string;
  organizationName?: string;
  emptyState: ApiDashboardEmptyState;
  setupProgress?: ApiDashboardSetupProgress;
  pendingInviteCount?: number;
};

function getDismissKey(orgId: string | undefined) {
  return orgId
    ? `devboard_getting_started_dismissed_${orgId}`
    : "devboard_getting_started_dismissed";
}

function getCompletionToastKey(orgId: string | undefined) {
  return orgId
    ? `devboard_setup_complete_toast_${orgId}`
    : "devboard_setup_complete_toast";
}

export function GettingStartedHub({
  persona,
  displayName,
  organizationName,
  emptyState,
  setupProgress,
  pendingInviteCount,
}: GettingStartedHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization } = useSelectedOrganization();
  const dismissKey = getDismissKey(organization?.id);
  const completionToastKey = getCompletionToastKey(organization?.id);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const wasCompleteRef = useRef(false);

  useEffect(() => {
    if (window.localStorage.getItem(dismissKey) === "1") {
      setChecklistDismissed(true);
    }
  }, [dismissKey]);

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") {
      return;
    }

    setShowWelcomeBanner(true);
    toast.success(
      organizationName
        ? `Welcome to ${organizationName}!`
        : "Welcome to your workspace!",
    );

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("welcome");
    const nextUrl = nextParams.size > 0 ? `/?${nextParams}` : "/";
    router.replace(nextUrl);
  }, [organizationName, router, searchParams]);

  const {
    steps,
    completedCount,
    totalCount,
    progressPercent,
    nextStep,
    isPending,
    isComplete,
  } = useSetupProgress({
    persona,
    emptyState,
    pendingInviteCount,
    setupProgressFromApi: setupProgress,
  });

  useEffect(() => {
    if (isPending) {
      return;
    }

    const wasComplete = wasCompleteRef.current;
    wasCompleteRef.current = isComplete;

    if (!isComplete || wasComplete) {
      return;
    }

    if (window.localStorage.getItem(completionToastKey) === "1") {
      return;
    }

    window.localStorage.setItem(completionToastKey, "1");
    toast.success(
      persona === "admin"
        ? "Workspace setup complete — you're ready to go!"
        : "You're all set — start exploring!",
    );
  }, [completionToastKey, isComplete, isPending, persona]);

  const dismissChecklist = useCallback(() => {
    window.localStorage.setItem(dismissKey, "1");
    setChecklistDismissed(true);
  }, [dismissKey]);

  const subtitle =
    persona === "admin"
      ? "Let's get your workspace ready — most teams finish setup in a few minutes."
      : organizationName
        ? `Welcome to ${organizationName}. Here's how to find your way around.`
        : "Welcome aboard. Here's how to find your way around.";

  const quickStartItems =
    persona === "admin" ? adminQuickStartItems : memberQuickStartItems;

  const tip = getWhatsNextTip(persona, nextStep, organizationName);
  const showChecklist = !checklistDismissed && !isComplete;

  return (
    <div className="flex flex-col gap-8">
      <DashboardGreeting
        displayName={displayName}
        organizationName={organizationName}
        subtitle={subtitle}
      />

      {showWelcomeBanner && persona === "member" ? (
        <WelcomeBanner organizationName={organizationName} />
      ) : null}

      {showChecklist ? (
        <div className="space-y-3">
          <SetupChecklist
            steps={steps}
            completedCount={completedCount}
            totalCount={totalCount}
            progressPercent={progressPercent}
            isPending={isPending}
            persona={persona}
          />
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={dismissChecklist}
            >
              Hide setup guide
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <QuickStartGrid items={quickStartItems} />
        <AppMapCard />
      </div>

      <WhatsNextTip tip={tip} />
    </div>
  );
}
