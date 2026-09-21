import { CalendarCheckIcon } from "@phosphor-icons/react/dist/ssr";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-white font-heading">
          Events
        </h2>
        <p className="text-sm text-white">
          Schedule standups, releases, and team milestones.
        </p>
      </div>

      <Empty className="border border-dashed border-devboard-primary/30 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarCheckIcon />
          </EmptyMedia>
          <EmptyTitle>Coming soon</EmptyTitle>
          <EmptyDescription>
            Events are on the way. You&apos;ll be able to plan standups,
            releases, and team milestones from here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
