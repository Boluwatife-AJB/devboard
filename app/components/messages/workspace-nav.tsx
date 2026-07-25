"use client";

import {
  LockIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { CreateChannelDialog } from "@/components/messages/create-channel-dialog";
import { ListError, ListSkeleton } from "@/components/messages/list-states";
import { NewDmDialog } from "@/components/messages/new-dm-dialog";
import { SquareAvatar } from "@/components/messages/square-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type {
  ActiveConversation,
  ApiChannel,
  ApiDmThread,
  ApiUser,
  UiPresence,
} from "@/types";

type WorkspaceNavProps = {
  channels: ApiChannel[];
  channelsLoading: boolean;
  channelsError: Error | null;
  dmThreads: ApiDmThread[];
  dmsLoading: boolean;
  dmsError: Error | null;
  me: ApiUser | undefined;
  displayNameOf: (userId: string) => string;
  presenceOf: (userId: string) => UiPresence;
  activeConversation: ActiveConversation | null;
  onSelectConversation: (conversation: ActiveConversation) => void;
};

export function WorkspaceNav({
  channels,
  channelsLoading,
  channelsError,
  dmThreads,
  dmsLoading,
  dmsError,
  me,
  displayNameOf,
  presenceOf,
  activeConversation,
  onSelectConversation,
}: WorkspaceNavProps) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const visibleChannels = query
    ? channels.filter((channel) => channel.name.toLowerCase().includes(query))
    : channels;

  const dmEntries = dmThreads.map((thread) => {
    const otherUserId =
      thread.participantA === me?.id
        ? thread.participantB
        : thread.participantA;
    return { thread, otherUserId, name: displayNameOf(otherUserId) };
  });

  const visibleDms = query
    ? dmEntries.filter((entry) => entry.name.toLowerCase().includes(query))
    : dmEntries;

  return (
    <aside className="flex h-full flex-col border-r border-[#2A2A2A] bg-[#131313]">
      <div className="h-18 border-b border-[#2A2A2A] p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8A8A]" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
              <CreateChannelDialog
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-[#C2C6D6] hover:text-white"
                    aria-label="Create channel"
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                }
                onCreated={(channel) =>
                  onSelectConversation({ type: "channel", id: channel.id })
                }
              />
            </div>

            {channelsLoading && <ListSkeleton />}

            {!channelsLoading && channelsError && (
              <ListError
                title="Failed to load channels."
                error={channelsError}
              />
            )}

            {!channelsLoading &&
              !channelsError &&
              visibleChannels.length === 0 && (
                <p className="px-2 py-2 text-xs text-[#8A8A8A]">
                  {query
                    ? "No channels match your search."
                    : "No channels yet. Create one to get started."}
                </p>
              )}

            {!channelsLoading &&
              !channelsError &&
              visibleChannels.length > 0 && (
                <ul className="space-y-0.5">
                  {visibleChannels.map((channel) => {
                    const isActive =
                      activeConversation?.type === "channel" &&
                      activeConversation.id === channel.id;
                    const isMember = channel.isMember;
                    return (
                      <li key={channel.id}>
                        <button
                          type="button"
                          onClick={() =>
                            onSelectConversation({
                              type: "channel",
                              id: channel.id,
                            })
                          }
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-xs px-2 py-2 text-left text-sm transition-colors",
                            isActive
                              ? "bg-[#1C1B1B] text-[#ADC6FF]"
                              : isMember
                                ? "text-[#C2C6D6] hover:bg-[#1C1B1B] hover:text-white"
                                : "text-[#6B6B6B] hover:bg-[#1C1B1B] hover:text-[#A0A0A0]",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-[#8A8A8A]">#</span>
                            <span className="truncate">{channel.slug}</span>
                            {!isMember && (
                              <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#8A8A8A]">
                                Join
                              </span>
                            )}
                          </div>

                          {channel.kind === "PRIVATE" && (
                            <LockIcon className="size-4 shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Direct Messages
              </h3>
              <NewDmDialog
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-[#C2C6D6] hover:text-white"
                    aria-label="Create direct message"
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                }
                onOpened={(thread) =>
                  onSelectConversation({ type: "dm", id: thread.id })
                }
              />
            </div>

            {dmsLoading && <ListSkeleton />}

            {!dmsLoading && dmsError && (
              <ListError
                title="Failed to load direct messages."
                error={dmsError}
              />
            )}

            {!dmsLoading && !dmsError && visibleDms.length === 0 && (
              <p className="px-2 py-2 text-xs text-[#8A8A8A]">
                {query
                  ? "No conversations match your search."
                  : "No direct messages yet."}
              </p>
            )}

            {!dmsLoading && !dmsError && visibleDms.length > 0 && (
              <ul className="space-y-0.5">
                {visibleDms.map(({ thread, otherUserId, name }) => {
                  const isActive =
                    activeConversation?.type === "dm" &&
                    activeConversation.id === thread.id;
                  return (
                    <li key={thread.id}>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectConversation({ type: "dm", id: thread.id })
                        }
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xs px-2 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-[#1C1B1B] text-[#ADC6FF]"
                            : "text-[#C2C6D6] hover:bg-[#1C1B1B] hover:text-white",
                        )}
                      >
                        <SquareAvatar
                          initials={initialsOf(name)}
                          color={avatarColorOf(otherUserId)}
                          status={presenceOf(otherUserId)}
                        />
                        {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
