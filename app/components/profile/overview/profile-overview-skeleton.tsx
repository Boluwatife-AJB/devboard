import { Skeleton } from "@/components/ui/skeleton";

export function ProfileOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-96 rounded-xs" />
          <Skeleton className="h-80 rounded-xs" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["a", "b", "c"].map((key) => (
              <Skeleton key={key} className="h-24 rounded-xs" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xs" />
          <Skeleton className="h-48 rounded-xs" />
        </div>
      </div>
    </div>
  );
}
