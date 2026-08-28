"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ProfileOverviewHeader() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl">
          User Profile Overview
        </h1>
        <Button
          className="rounded-xs"
          render={<Link href="/profile/edit-profile" />}
        >
          <PencilSimpleIcon data-icon="inline-start" />
          Edit Profile
        </Button>
      </div>
    </div>
  );
}
