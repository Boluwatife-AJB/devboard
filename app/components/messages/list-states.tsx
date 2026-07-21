import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton() {
  return (
    <div className="space-y-2 px-2 py-1">
      {["a", "b", "c", "d"].map((key) => (
        <Skeleton key={key} className="h-7 w-full rounded-xs bg-[#1C1B1B]" />
      ))}
    </div>
  );
}

export function ListError({ title, error }: { title: string; error: Error }) {
  return (
    <div className="rounded-xs border border-[#FF6B6B33] bg-[#FF6B6B0D] px-3 py-2">
      <p className="text-xs text-[#FF6B6B]">{title}</p>
      <p className="mt-1 text-[10px] text-[#8A8A8A]">{error.message}</p>
    </div>
  );
}

export function EmptyChatPane({ message }: { message: string }) {
  return (
    <section className="flex h-full min-w-0 flex-col items-center justify-center bg-[#0B0E14]">
      <p className="text-sm text-[#8A8A8A]">{message}</p>
    </section>
  );
}
