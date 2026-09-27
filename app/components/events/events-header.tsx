"use client";

type EventsHeaderProps = {
  canCreate: boolean;
  onCreateClick: () => void;
};

// biome-ignore lint/correctness/noUnusedFunctionParameters: consider for future use
export function EventsHeader({ canCreate, onCreateClick }: EventsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Events &amp; Milestones
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Schedule standups, reviews, and team meetings. Everyone in the
          audience is notified when an event is created or cancelled.
        </p>
      </div>

      {/* <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xs"
          disabled
          title="Calendar sync coming soon"
        >
          <ArrowsClockwiseIcon data-icon="inline-start" />
          Sync to Calendar
        </Button>
        {canCreate && (
          <Button
            type="button"
            size="sm"
            className="rounded-xs"
            onClick={onCreateClick}
          >
            <PlusIcon data-icon="inline-start" />
            Create Event
          </Button>
        )}
      </div> */}
    </div>
  );
}
