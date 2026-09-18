"use client";

import { ProfileActiveProjectsCard } from "@/components/profile/overview/profile-active-projects-card";
import { ProfileActivityChart } from "@/components/profile/overview/profile-activity-chart";
import { ProfileInfoCard } from "@/components/profile/overview/profile-info-card";
import { ProfileOverviewHeader } from "@/components/profile/overview/profile-overview-header";
import { ProfileStatsGrid } from "@/components/profile/overview/profile-stats-grid";
import { ProfileTeamsCard } from "@/components/profile/overview/profile-teams-card";
import { profileOverviewData } from "@/constant";
import { useMyOrgProfile } from "@/hooks/use-my-org-profile";
import { getFirstName } from "@/lib/dashboard-utils";
import { ProfileOverviewSkeleton } from "./profile-overview-skeleton";

export function ProfileOverview() {
  const { data: orgProfile, isPending } = useMyOrgProfile();

  if (isPending) {
    return <ProfileOverviewSkeleton />;
  }

  const displayName = orgProfile?.displayName;
  const profile = {
    ...profileOverviewData,
    firstName: displayName
      ? getFirstName(displayName)
      : profileOverviewData.firstName,
    lastName: displayName
      ? displayName.trim().split(/\s+/).slice(1).join(" ") ||
        profileOverviewData.lastName
      : profileOverviewData.lastName,
    handle: displayName
      ? displayName.toLowerCase().replace(/\s+/g, "_")
      : profileOverviewData.handle,
    avatarUrl: orgProfile?.avatarUrl ?? profileOverviewData.avatarUrl,
  };

  return (
    <div className="flex flex-col gap-8">
      <ProfileOverviewHeader />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <ProfileInfoCard
            firstName={profile.firstName}
            lastName={profile.lastName}
            handle={profile.handle}
            role={profile.role}
            team={profile.team}
            location={profile.location}
            avatarUrl={profile.avatarUrl}
          />
          <ProfileActiveProjectsCard projects={profile.activeProjects} />
        </div>

        <div className="flex flex-col gap-6">
          <ProfileStatsGrid stats={profile.stats} />
          <ProfileActivityChart data={profile.activity} />
          <ProfileTeamsCard teams={profile.teams} />
        </div>
      </div>
    </div>
  );
}
