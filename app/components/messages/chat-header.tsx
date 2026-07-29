import {
  DotsThreeVerticalIcon,
  InfoIcon,
  LockIcon,
  PhoneIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChannelKind } from "@/types";

export function ChatHeader({
  title,
  subtitle,
  detailsOpen,
  onToggleDetails,
  kind,
  onClearMessages,
  clearPending,
}: {
  title: string;
  subtitle: string;
  detailsOpen?: boolean;
  onToggleDetails?: () => void;
  kind?: ChannelKind;
  onClearMessages?: () => void;
  clearPending?: boolean;
}) {
  return (
    <header className="flex h-18 items-center justify-between gap-4 border-b border-[#2A2A2A] px-6 py-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 truncate text-lg font-semibold text-white">
          {title}
          {kind === "PRIVATE" && <LockIcon className="size-4" />}
        </h2>
        <p className="truncate text-xs text-[#8A8A8A]">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-[#C2C6D6] hover:text-white"
          aria-label="Start voice call"
        >
          <PhoneIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-[#C2C6D6] hover:text-white"
          aria-label="Start video call"
        >
          <VideoCameraIcon className="size-4" />
        </Button>
        {onClearMessages && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#C2C6D6] hover:text-white"
                  aria-label="Conversation options"
                >
                  <DotsThreeVerticalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="w-48 border-[#2A2A2A] bg-[#131313]"
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={clearPending}
                  onClick={onClearMessages}
                >
                  Clear messages
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onToggleDetails && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              "text-[#C2C6D6] hover:text-white",
              detailsOpen && "bg-[#1C1B1B] text-[#ADC6FF] hover:text-[#ADC6FF]",
            )}
            aria-label={detailsOpen ? "Hide channel info" : "Show channel info"}
            aria-pressed={detailsOpen}
            onClick={onToggleDetails}
          >
            <InfoIcon className="size-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
