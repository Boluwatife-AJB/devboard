"use client";

import { useState } from "react";
import { AvatarCard } from "@/components/profile/edit/avatar-card";
import { EditProfileShell } from "@/components/profile/edit/edit-profile-shell";
import { NotificationsSettingsCard } from "@/components/profile/edit/notifications-settings-card";
import { PersonalInformationCard } from "@/components/profile/edit/personal-information-card";
import { SecuritySettingsCard } from "@/components/profile/edit/security-settings-card";
import { editProfileDefaults } from "@/constant";
import { useMe } from "@/hooks/use-me";
import { getFirstName } from "@/lib/dashboard-utils";
import type { ProfileSettingsSection } from "@/types";

export function EditProfileView() {
  const [section, setSection] = useState<ProfileSettingsSection>("general");
  const { data: me } = useMe();

  const displayName = me?.displayName ?? "Alex Chen";
  const nameParts = displayName.trim().split(/\s+/);
  const firstName = getFirstName(displayName);
  const lastName =
    nameParts.length > 1
      ? nameParts.slice(1).join(" ")
      : editProfileDefaults.lastName;

  const formDefaults = {
    ...editProfileDefaults,
    firstName,
    lastName,
    displayName: me?.displayName
      ? me.displayName.toLowerCase().replace(/\s+/g, "_")
      : editProfileDefaults.displayName,
  };

  return (
    <EditProfileShell section={section} onSectionChange={setSection}>
      {section === "general" ? (
        <>
          <PersonalInformationCard defaultValues={formDefaults} />
          <AvatarCard displayName={displayName} />
        </>
      ) : null}

      {section === "notifications" ? <NotificationsSettingsCard /> : null}

      {section === "security" ? <SecuritySettingsCard /> : null}
    </EditProfileShell>
  );
}
