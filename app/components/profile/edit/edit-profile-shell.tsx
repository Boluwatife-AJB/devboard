"use client";

import type { ReactNode } from "react";
import { EditProfileNav } from "@/components/profile/edit/edit-profile-nav";
import type { ProfileSettingsSection } from "@/types";

type EditProfileShellProps = {
  section: ProfileSettingsSection;
  onSectionChange: (section: ProfileSettingsSection) => void;
  children: ReactNode;
};

export function EditProfileShell({
  section,
  onSectionChange,
  children,
}: EditProfileShellProps) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl">
        Profile & Preferences
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <EditProfileNav section={section} onSectionChange={onSectionChange} />
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}
