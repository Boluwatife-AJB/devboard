"use client";

import { profileSettingsNav } from "@/constant";
import { cn } from "@/lib/utils";
import type { ProfileSettingsSection } from "@/types";

type EditProfileNavProps = {
  section: ProfileSettingsSection;
  onSectionChange: (section: ProfileSettingsSection) => void;
};

export function EditProfileNav({
  section,
  onSectionChange,
}: EditProfileNavProps) {
  return (
    <nav className="flex flex-col gap-1">
      {profileSettingsNav.map((item) => {
        const isActive = section === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "rounded-xs px-3 py-2 text-left text-sm transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
