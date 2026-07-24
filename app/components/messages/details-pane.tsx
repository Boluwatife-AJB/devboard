import { BellSlashIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ApiChannel } from "@/types";

export function DetailsPane({ channel }: { channel: ApiChannel }) {
  return (
    <aside className="flex h-full flex-col border-l border-[#2A2A2A] bg-[#131313]">
      <ScrollArea className="max-h-[calc(100vh-12rem)] flex-1">
        <div className="space-y-6 p-5">
          <h3 className="text-sm font-semibold text-white">Channel Details</h3>
          <h2 className="text-xl font-semibold text-white">{channel.name}</h2>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Description
            </p>
            <p className="text-sm leading-relaxed text-[#C2C6D6]">
              {channel.description ?? "No description yet."}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Visibility
            </p>
            <p className="text-sm text-[#C2C6D6]">
              {channel.kind === "PRIVATE"
                ? "Private, invite only"
                : "Open, anyone in the org can join"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Slug
            </p>
            <p className="font-mono text-sm text-[#C2C6D6]">#{channel.slug}</p>
          </div>
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t border-[#2A2A2A] p-4">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start rounded-xs text-[#C2C6D6] hover:text-white"
        >
          <BellSlashIcon data-icon="inline-start" className="size-4" />
          Mute Channel
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start rounded-xs text-[#FF6B6B] hover:bg-[#FF6B6B1A] hover:text-[#FF6B6B]"
        >
          <SignOutIcon data-icon="inline-start" className="size-4" />
          Leave Channel
        </Button>
      </div>
    </aside>
  );
}
