import { cn } from "@/lib/utils";
import type { UiPresence } from "@/types";

export function StatusDot({ status }: { status: UiPresence }) {
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-[#131313]",
        status === "online" && "bg-[#22C55E]",
        status === "away" && "bg-[#F59E0B]",
        status === "offline" && "bg-[#6B7280]",
      )}
    />
  );
}

export function SquareAvatar({
  initials,
  color,
  status,
}: {
  initials: string;
  color: string;
  status?: UiPresence;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className="flex size-7.5 items-center justify-center rounded-xs text-[10px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {status && <StatusDot status={status} />}
    </div>
  );
}
