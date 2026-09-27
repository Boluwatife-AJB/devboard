"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type EventEmptyStateProps = {
  filtered?: boolean;
  canCreate?: boolean;
  onCreateClick?: () => void;
};

export function EventEmptyState({
  filtered = false,
  canCreate = false,
  onCreateClick,
}: EventEmptyStateProps) {
  return (
    <Empty className="border border-dashed border-border py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarBlankIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filtered ? "No matching events" : "No upcoming events"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Try clearing filters or adjusting your search."
            : canCreate
              ? "Schedule a standup or meeting to get your team on the same page."
              : "When someone schedules an event you’re invited to, it will show up here."}
        </EmptyDescription>
        {canCreate && !filtered && onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="mt-2 text-sm font-medium text-devboard-primary hover:underline"
          >
            Create your first event
          </button>
        )}
      </EmptyHeader>
    </Empty>
  );
}
