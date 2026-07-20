"use client";

import {
  BellSlashIcon,
  FileCodeIcon,
  FilePdfIcon,
  GitBranchIcon,
  ImageIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  SignOutIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { MessageComposer } from "@/components/messages/message-composer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  channelMembers,
  directMessages,
  engineeringSyncMessages,
  messageChannels,
  sharedFiles,
} from "@/constant";
import { cn } from "@/lib/utils";
import type { ChatMessage, MessageChannel } from "@/types";

function StatusDot({ status }: { status: "online" | "away" | "offline" }) {
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

function getChannelById(id: string) {
  return messageChannels.find((channel) => channel.id === id);
}

function SquareAvatar({
  initials,
  color,
  status,
  imageUrl,
}: {
  initials: string;
  color: string;
  status?: "online" | "away" | "offline";
  imageUrl?: string;
}) {
  return (
    <div className="relative shrink-0">
      {imageUrl ? (
        <Avatar className="size-7 rounded-xs">
          <AvatarImage src={imageUrl} alt="" />
          <AvatarFallback className="rounded-xs text-[10px]">
            {initials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div
          className="flex size-7 items-center justify-center rounded-xs text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}
      {status && <StatusDot status={status} />}
    </div>
  );
}

function FileKindIcon({ kind }: { kind: "pdf" | "image" | "code" }) {
  if (kind === "pdf") {
    return <FilePdfIcon className="size-5 text-[#FF6B6B]" weight="fill" />;
  }
  if (kind === "image") {
    return <ImageIcon className="size-5 text-[#4D8EFF]" weight="fill" />;
  }
  return <FileCodeIcon className="size-5 text-[#22C55E]" weight="fill" />;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.isSelf) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] space-y-1">
          <p className="text-right text-[10px] text-[#8A8A8A]">
            {message.timestamp} · You
          </p>
          <div className="rounded-xs border border-[#2A2A2A] bg-[#1C1B1B] px-4 py-3 text-sm leading-relaxed text-[#E5E5E5]">
            {message.body}
          </div>
          {message.type === "text" && message.read && (
            <p className="flex items-center justify-end gap-1 text-[10px] text-[#4D8EFF]">
              <span className="inline-block size-3 rounded-full border border-[#4D8EFF]" />
              Read
            </p>
          )}
        </div>
        <Avatar className="size-8 shrink-0">
          <AvatarImage src="https://avatars.githubusercontent.com/u/56480003?v=4" />
          <AvatarFallback className="text-[10px]">Y</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <SquareAvatar
        initials={message.initials}
        color={message.avatarColor}
        imageUrl={
          message.author === "Sarah Kang"
            ? "https://i.pravatar.cc/64?img=5"
            : undefined
        }
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs text-[#8A8A8A]">
          <span className="font-semibold text-white">{message.author}</span>{" "}
          {message.timestamp}
        </p>
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-[#E5E5E5]">
            {message.body}
          </p>
          {message.type === "commit" && (
            <div className="rounded-xs border border-[#2A2A2A] bg-[#0B0E14] p-3">
              <div className="flex items-center gap-2 text-xs text-[#C2C6D6]">
                <GitBranchIcon className="size-4" />
                <span className="font-mono">commit {message.commitHash}</span>
              </div>
              <p className="mt-2 text-sm text-white">{message.commitMessage}</p>
            </div>
          )}
          {message.type === "text" && message.reactions && (
            <div className="flex flex-wrap gap-2">
              {message.reactions.map((reaction) => (
                <span
                  key={reaction.emoji}
                  className="inline-flex items-center gap-1 rounded-xs border border-[#4A4A4A] bg-[#131313] px-2 py-0.5 text-xs text-[#C2C6D6]"
                >
                  {reaction.emoji} {reaction.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkspaceNav({
  activeChannelId,
  onSelectChannel,
}: {
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
}) {
  return (
    <aside className="flex h-full flex-col border-r border-[#2A2A2A] bg-[#131313]">
      <div className="border-b border-[#2A2A2A] p-4 h-18">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8A8A]" />
          <Input
            placeholder="Search channel..."
            className="h-10 rounded-xs border-[#2A2A2A] bg-[#0B0E14] pl-10 text-sm placeholder:text-[#8A8A8A]"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Channels
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-[#C2C6D6] hover:text-white"
                aria-label="Create channel"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
            <ul className="space-y-0.5">
              {messageChannels.map((channel) => (
                <li key={channel.id}>
                  <button
                    type="button"
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xs px-2 py-2 text-left text-sm transition-colors",
                      activeChannelId === channel.id
                        ? "bg-[#1C1B1B] text-[#ADC6FF]"
                        : "text-[#C2C6D6] hover:bg-[#1C1B1B] hover:text-white",
                    )}
                  >
                    <span className="text-[#8A8A8A]">#</span>
                    {channel.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Direct Messages
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-[#C2C6D6] hover:text-white"
                aria-label="Create direct message"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
            <ul className="space-y-0.5">
              {directMessages.map((dm) => (
                <li key={dm.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xs px-2 py-2 text-left text-sm text-[#C2C6D6] transition-colors hover:bg-[#1C1B1B] hover:text-white"
                  >
                    <SquareAvatar
                      initials={dm.initials}
                      color={dm.color}
                      status={dm.status}
                    />
                    {dm.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

function ChatPane({
  channel,
  detailsOpen,
  onToggleDetails,
}: {
  channel: MessageChannel;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const messages = useMemo(() => {
    if (channel.id === "engineering-sync") {
      return engineeringSyncMessages;
    }
    return engineeringSyncMessages.slice(0, 1);
  }, [channel.id]);

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0B0E14]">
      <header className="flex h-18 items-center justify-between gap-4 border-b border-[#2A2A2A] px-6 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-white">
            # {channel.name}
          </h2>
          <p className="truncate text-xs text-[#8A8A8A]">{channel.subtitle}</p>
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
        </div>
      </header>

      <ScrollArea className="flex-1 max-h-[calc(100vh-23rem)]">
        <div className="space-y-6 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#2A2A2A]" />
            <span className="text-xs text-[#8A8A8A]">
              Wednesday, October 24
            </span>
            <div className="h-px flex-1 bg-[#2A2A2A]" />
          </div>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      <MessageComposer key={channel.id} channelName={channel.name} />
    </section>
  );
}

function DetailsPane({ channel }: { channel: MessageChannel }) {
  return (
    <aside className="flex h-full flex-col border-l border-[#2A2A2A] bg-[#131313]">
      <ScrollArea className="flex-1 max-h-[calc(100vh-12rem)]">
        <div className="space-y-6 p-5">
          <h3 className="text-sm font-semibold text-white">Channel Details</h3>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Description
            </p>
            <p className="text-sm leading-relaxed text-[#C2C6D6]">
              {channel.description}
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-white"
            >
              Members ({channel.memberCount})
              <span className="text-[#8A8A8A]">›</span>
            </button>
            <ul className="space-y-2">
              {channelMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-2">
                  <SquareAvatar
                    initials={member.initials}
                    color={member.color}
                    status={member.status}
                  />
                  <span className="text-sm text-[#E5E5E5]">{member.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Shared Files</p>
            <ul className="space-y-2">
              {sharedFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 rounded-xs border border-[#2A2A2A] bg-[#0B0E14] p-3"
                >
                  <FileKindIcon kind={file.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{file.name}</p>
                    <p className="text-xs text-[#8A8A8A]">
                      {file.size} · {file.date}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xs border-[#2A2A2A] text-[#C2C6D6]"
            >
              View All Files
            </Button>
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

export function MessagesView() {
  const [activeChannelId, setActiveChannelId] = useState("engineering-sync");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const channel = getChannelById(activeChannelId) ?? messageChannels[0];

  return (
    <div className="grid h-[calc(100vh-5rem)] grid-cols-7 overflow-hidden border-0 bg-[#0B0E14]">
      <div className="col-span-2 min-h-0">
        <WorkspaceNav
          activeChannelId={activeChannelId}
          onSelectChannel={(id) => {
            setActiveChannelId(id);
            setDetailsOpen(false);
          }}
        />
      </div>
      <div className={cn("min-h-0", detailsOpen ? "col-span-3" : "col-span-5")}>
        <ChatPane
          channel={channel}
          detailsOpen={detailsOpen}
          onToggleDetails={() => setDetailsOpen((open) => !open)}
        />
      </div>
      {detailsOpen && (
        <div className="col-span-2 min-h-0">
          <DetailsPane channel={channel} />
        </div>
      )}
    </div>
  );
}
