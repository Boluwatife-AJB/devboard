"use client";

import { useMemo, useState } from "react";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventList } from "@/components/events/event-list";
import { EventListPagination } from "@/components/events/event-list-pagination";
import { EventsHeader } from "@/components/events/events-header";
import { EventsSummaryCards } from "@/components/events/events-summary-cards";
import {
  EventsToolbar,
  type EventsViewTab,
} from "@/components/events/events-toolbar";
import { defaultEventsRange } from "@/components/events/lib/group-events";
import { buildEventSummaryStats } from "@/components/events/lib/summary-from-events";
import { ScheduleEventSidebar } from "@/components/events/schedule-event-sidebar";
import { useEvents } from "@/hooks/use-events";
import { useProjects } from "@/hooks/use-projects";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { useTeams } from "@/hooks/use-teams";
import type { EventType } from "@/types";

const PAGE_SIZE = 10;

export function EventsView() {
  const { isAdmin, ready } = useSelectedOrganization();
  const canCreate = ready && isAdmin;
  const canManage = canCreate;

  const range = useMemo(() => defaultEventsRange(), []);
  const {
    data: events = [],
    isLoading,
    isError,
  } = useEvents(range.from, range.to);
  const { data: teams = [] } = useTeams();
  const { data: projects = [] } = useProjects();

  const [tab, setTab] = useState<EventsViewTab>("upcoming");
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [teamId, setTeamId] = useState<string | "ALL">("ALL");
  const [projectId, setProjectId] = useState<string | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((event) => {
      if (eventType !== "ALL" && event.eventType !== eventType) return false;
      if (teamId !== "ALL" && event.teamId !== teamId) return false;
      if (projectId !== "ALL" && event.projectId !== projectId) return false;
      if (!q) return true;
      return (
        event.title.toLowerCase().includes(q) ||
        (event.description?.toLowerCase().includes(q) ?? false) ||
        event.eventType.toLowerCase().includes(q)
      );
    });
  }, [events, search, eventType, teamId, projectId]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const pagedEvents = useMemo(() => {
    const start = safePageIndex * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, safePageIndex]);

  const rangeStart =
    filteredEvents.length === 0 ? 0 : safePageIndex * PAGE_SIZE + 1;
  const rangeEnd = Math.min(
    (safePageIndex + 1) * PAGE_SIZE,
    filteredEvents.length,
  );

  const resetToFirstPage = () => setPageIndex(0);

  const stats = useMemo(
    () => buildEventSummaryStats(filteredEvents),
    [filteredEvents],
  );

  const isFiltered =
    Boolean(search.trim()) ||
    eventType !== "ALL" ||
    teamId !== "ALL" ||
    projectId !== "ALL";

  return (
    <div className="flex flex-col gap-8">
      <EventsHeader
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <EventsSummaryCards stats={stats} />

      <EventsToolbar
        tab={tab}
        onTabChange={setTab}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          resetToFirstPage();
        }}
        eventType={eventType}
        onEventTypeChange={(value) => {
          setEventType(value);
          resetToFirstPage();
        }}
        teamId={teamId}
        onTeamIdChange={(value) => {
          setTeamId(value);
          resetToFirstPage();
        }}
        projectId={projectId}
        onProjectIdChange={(value) => {
          setProjectId(value);
          resetToFirstPage();
        }}
        teams={teams}
        projects={projects}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <EventList
            events={pagedEvents}
            isLoading={isLoading}
            isError={isError}
            filtered={isFiltered}
            teams={teams}
            projects={projects}
            canCreate={canCreate}
            canManage={canManage}
            onCreateClick={() => setCreateOpen(true)}
          />
          {!isLoading && !isError && (
            <EventListPagination
              pageIndex={safePageIndex}
              pageCount={pageCount}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              total={filteredEvents.length}
              onPageChange={setPageIndex}
            />
          )}
        </div>

        {canCreate && (
          <div className="xl:col-span-1">
            <div className="hidden xl:block">
              <ScheduleEventSidebar />
            </div>
          </div>
        )}
      </div>

      {canCreate && (
        <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  );
}
