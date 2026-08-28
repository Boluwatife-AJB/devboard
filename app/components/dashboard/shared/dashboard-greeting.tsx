"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { getFirstName, getGreetingPeriod } from "@/lib/dashboard-utils";

type DashboardGreetingProps = {
  displayName?: string;
  organizationName?: string;
  subtitle: string;
};

export function DashboardGreeting({
  displayName,
  organizationName,
  subtitle,
}: DashboardGreetingProps) {
  const firstName = getFirstName(displayName);
  const greeting = getGreetingPeriod();
  const context = organizationName ? ` · ${organizationName}` : "";

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {greeting}, {firstName}
        {context}
      </h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function DashboardGreetingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-9 w-96 max-w-full" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}
