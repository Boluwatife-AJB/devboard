"use client";

import {
  ArrowSquareOutIcon,
  BellSlashIcon,
  InfoIcon,
  LockIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  SignOutIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CreateChannelDialog } from "@/components/messages/create-channel-dialog";
import { MessageComposer } from "@/components/messages/message-composer";
import { NewDmDialog } from "@/components/messages/new-dm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import {
  useChannelMessages,
  useChannels,
  useDmMessages,
  useDmThreads,
  useMarkChannelAsRead,
  useMarkDmAsRead,
  useSendDm,
  useSendMessage,
} from "@/hooks/use-messaging";
import {
  useChannelMessageEvents,
  useDmReceivedEvents,
  usePresenceEvents,
} from "@/hooks/use-messaging-events";
import { useOrgMembers } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api";
import { avatarColorOf, initialsOf } from "@/lib/task-ui";
import { cn } from "@/lib/utils";
import type {
  ActiveConversation,
  ApiChannel,
  ApiDmThread,
  ApiMessageEmbed,
  ApiUser,
  ChannelKind,
  PresenceStatus,
} from "@/types";

type UiPresence = "online" | "away" | "offline";

function toUiPresence(status: PresenceStatus | undefined): UiPresence {
  if (status === "ONLINE") return "online";
  if (status === "AWAY") return "away";
  return "offline";
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

type DisplayMessage = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  isEdited: boolean;
  isRead?: boolean;
  embeds?: ApiMessageEmbed[];
};

function groupMessagesByDay(messages: DisplayMessage[]) {
  const groups: { label: string; messages: DisplayMessage[] }[] = [];
  for (const message of messages) {
    const label = formatDayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.messages.push(message);
    } else {
      groups.push({ label, messages: [message] });
    }
  }
  return groups;
}

function StatusDot({ status }: { status: UiPresence }) {
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

function SquareAvatar({
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
        className="flex size-7 items-center justify-center rounded-xs text-[10px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {status && <StatusDot status={status} />}
    </div>
  );
}

function EmbedCard({ embed }: { embed: ApiMessageEmbed }) {
  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xs border border-[#2A2A2A] bg-[#0B0E14] p-3 transition-colors hover:border-[#4A4A4A]"
    >
      <div className="flex items-center gap-2 text-xs text-[#C2C6D6]">
        <ArrowSquareOutIcon className="size-4" />
        <span className="truncate">
          {embed.siteName ?? embed.repo ?? embed.kind.toLowerCase()}
        </span>
      </div>
      <p className="mt-2 truncate text-sm text-white">
        {embed.title ?? embed.url}
      </p>
      {embed.description && (
        <p className="mt-1 line-clamp-2 text-xs text-[#8A8A8A]">
          {embed.description}
        </p>
      )}
    </a>
  );
}

function MessageBubble({
  message,
  authorName,
  isSelf,
}: {
  message: DisplayMessage;
  authorName: string;
  isSelf: boolean;
}) {
  const editedSuffix = message.isEdited ? " (edited)" : "";

  if (isSelf) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] space-y-1">
          <p className="text-right text-[10px] text-[#8A8A8A]">
            {formatTime(message.createdAt)} · You{editedSuffix}
          </p>
          <div className="whitespace-pre-wrap rounded-xs border border-[#2A2A2A] bg-[#1C1B1B] px-4 py-3 text-sm leading-relaxed text-[#E5E5E5]">
            {message.body}
          </div>
          {message.isRead && (
            <p className="flex items-center justify-end gap-1 text-[10px] text-[#4D8EFF]">
              <span className="inline-block size-3 rounded-full border border-[#4D8EFF]" />
              Read
            </p>
          )}
        </div>
        <SquareAvatar
          initials={initialsOf(authorName)}
          color={avatarColorOf(message.authorId)}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <SquareAvatar
        initials={initialsOf(authorName)}
        color={avatarColorOf(message.authorId)}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs text-[#8A8A8A]">
          <span className="font-semibold text-white">{authorName}</span>{" "}
          {formatTime(message.createdAt)}
          {editedSuffix}
        </p>
        <div className="space-y-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#E5E5E5]">
            {message.body}
          </p>
          {message.embeds?.map((embed) => (
            <EmbedCard key={embed.url} embed={embed} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 px-2 py-1">
      {["a", "b", "c", "d"].map((key) => (
        <Skeleton key={key} className="h-7 w-full rounded-xs bg-[#1C1B1B]" />
      ))}
    </div>
  );
}

function ListError({ title, error }: { title: string; error: Error }) {
  return (
    <div className="rounded-xs border border-[#FF6B6B33] bg-[#FF6B6B0D] px-3 py-2">
      <p className="text-xs text-[#FF6B6B]">{title}</p>
      <p className="mt-1 text-[10px] text-[#8A8A8A]">{error.message}</p>
    </div>
  );
}

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

function WorkspaceNav({
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
      <div className="border-b border-[#2A2A2A] p-4 h-18">
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
                              : "text-[#C2C6D6] hover:bg-[#1C1B1B] hover:text-white",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#8A8A8A]">#</span>
                            {channel.slug}
                          </div>

                          {channel.kind === "PRIVATE" && (
                            <LockIcon className="size-4" />
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

function ChatHeader({
  title,
  subtitle,
  detailsOpen,
  onToggleDetails,
  kind,
}: {
  title: string;
  subtitle: string;
  detailsOpen?: boolean;
  onToggleDetails?: () => void;
  kind?: ChannelKind;
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

function MessageList({
  messages,
  isLoading,
  error,
  emptyMessage,
  myUserId,
  displayNameOf,
  bottomRef,
}: {
  messages: DisplayMessage[];
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  myUserId: string | undefined;
  displayNameOf: (userId: string) => string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-6">
        {["a", "b", "c"].map((key) => (
          <div key={key} className="flex gap-3">
            <Skeleton className="size-7 rounded-xs bg-[#1C1B1B]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32 rounded-xs bg-[#1C1B1B]" />
              <Skeleton className="h-4 w-2/3 rounded-xs bg-[#1C1B1B]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-6">
        <div className="text-center">
          <p className="text-sm text-[#FF6B6B]">Failed to load messages.</p>
          <p className="mt-1 text-xs text-[#8A8A8A]">{error.message}</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-6">
        <p className="text-sm text-[#8A8A8A]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6">
      {groupMessagesByDay(messages).map((group) => (
        <div key={group.label} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#2A2A2A]" />
            <span className="text-xs text-[#8A8A8A]">{group.label}</span>
            <div className="h-px flex-1 bg-[#2A2A2A]" />
          </div>
          {group.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              authorName={displayNameOf(message.authorId)}
              isSelf={message.authorId === myUserId}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function ChannelChatPane({
  channel,
  me,
  displayNameOf,
  detailsOpen,
  onToggleDetails,
}: {
  channel: ApiChannel;
  me: ApiUser | undefined;
  displayNameOf: (userId: string) => string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const {
    data: messages = [],
    isLoading,
    error,
  } = useChannelMessages(channel.id);
  useChannelMessageEvents(channel.id);
  const sendMessage = useSendMessage(channel.id);
  const markAsRead = useMarkChannelAsRead();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (lastMessageId) {
      markAsRead.mutate({ channelId: channel.id, lastMessageId });
    }
  }, [channel.id, lastMessageId, markAsRead.mutate]);

  useEffect(() => {
    if (!lastMessageId) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0B0E14]">
      <ChatHeader
        title={`# ${channel.slug}`}
        subtitle={channel.description ?? `#${channel.slug}`}
        detailsOpen={detailsOpen}
        onToggleDetails={onToggleDetails}
      />

      <ScrollArea className="flex-1 max-h-[calc(100vh-23rem)]">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          emptyMessage={`No messages yet in #${channel.slug}. Say hello!`}
          myUserId={me?.id}
          displayNameOf={displayNameOf}
          bottomRef={bottomRef}
        />
      </ScrollArea>

      <MessageComposer
        key={channel.id}
        channelName={channel.name}
        onSend={(_html, text) => {
          sendMessage.mutate(
            { body: text },
            {
              onError: (sendError) =>
                toast.error(getApiErrorMessage(sendError)),
            },
          );
        }}
      />
    </section>
  );
}

function DmChatPane({
  thread,
  me,
  displayNameOf,
  presenceOf,
}: {
  thread: ApiDmThread;
  me: ApiUser | undefined;
  displayNameOf: (userId: string) => string;
  presenceOf: (userId: string) => UiPresence;
}) {
  const otherUserId =
    thread.participantA === me?.id ? thread.participantB : thread.participantA;
  const otherName = displayNameOf(otherUserId);

  const { data: messages = [], isLoading, error } = useDmMessages(thread.id);
  useDmReceivedEvents(thread.id);
  const sendDm = useSendDm(thread.id);
  const markAsRead = useMarkDmAsRead();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (lastMessageId) {
      markAsRead.mutate(thread.id);
    }
  }, [thread.id, lastMessageId, markAsRead.mutate]);

  useEffect(() => {
    if (!lastMessageId) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0B0E14]">
      <ChatHeader
        title={otherName}
        subtitle={
          presenceOf(otherUserId) === "online"
            ? "Online"
            : presenceOf(otherUserId) === "away"
              ? "Away"
              : "Offline"
        }
      />

      <ScrollArea className="flex-1 max-h-[calc(100vh-23rem)]">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          emptyMessage={`This is the beginning of your conversation with ${otherName}.`}
          myUserId={me?.id}
          displayNameOf={displayNameOf}
          bottomRef={bottomRef}
        />
      </ScrollArea>

      <MessageComposer
        key={thread.id}
        channelName={otherName}
        onSend={(_html, text) => {
          sendDm.mutate(
            { body: text },
            {
              onError: (sendError) =>
                toast.error(getApiErrorMessage(sendError)),
            },
          );
        }}
      />
    </section>
  );
}

function DetailsPane({ channel }: { channel: ApiChannel }) {
  return (
    <aside className="flex h-full flex-col border-l border-[#2A2A2A] bg-[#131313]">
      <ScrollArea className="flex-1 max-h-[calc(100vh-12rem)]">
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
                ? "Private — invite only"
                : "Open — anyone in the org can join"}
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

function EmptyChatPane({ message }: { message: string }) {
  return (
    <section className="flex h-full min-w-0 flex-col items-center justify-center bg-[#0B0E14]">
      <p className="text-sm text-[#8A8A8A]">{message}</p>
    </section>
  );
}

export function MessagesView() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);
  const [presence, setPresence] = useState<Record<string, PresenceStatus>>({});

  const { data: me } = useMe();
  const { data: members = [] } = useOrgMembers();
  const {
    data: channels = [],
    isLoading: channelsLoading,
    error: channelsError,
  } = useChannels();
  const {
    data: dmThreads = [],
    isLoading: dmsLoading,
    error: dmsError,
  } = useDmThreads();

  usePresenceEvents(
    useCallback((update: { userId: string; status: PresenceStatus }) => {
      setPresence((current) => ({
        ...current,
        [update.userId]: update.status,
      }));
    }, []),
  );

  const memberById = useMemo(() => {
    const map = new Map<string, ApiUser>();
    for (const member of members) {
      if (member.user) map.set(member.userId, member.user);
    }
    if (me) map.set(me.id, me);
    return map;
  }, [members, me]);

  const displayNameOf = useCallback(
    (userId: string) => memberById.get(userId)?.displayName ?? "Unknown user",
    [memberById],
  );

  const presenceOf = useCallback(
    (userId: string) => toUiPresence(presence[userId]),
    [presence],
  );

  useEffect(() => {
    if (channels[0] && !activeConversation) {
      setActiveConversation({ type: "channel", id: channels[0].id });
    }
  }, [channels, activeConversation]);

  const activeChannel =
    activeConversation?.type === "channel"
      ? (channels.find((channel) => channel.id === activeConversation.id) ??
        null)
      : null;

  const activeThread =
    activeConversation?.type === "dm"
      ? (dmThreads.find((thread) => thread.id === activeConversation.id) ??
        null)
      : null;

  const showDetails = detailsOpen && activeChannel !== null;

  return (
    <div className="grid h-[calc(100vh-5rem)] grid-cols-7 overflow-hidden border-0 bg-[#0B0E14]">
      <div className="col-span-2 min-h-0">
        <WorkspaceNav
          channels={channels}
          channelsLoading={channelsLoading}
          channelsError={channelsError}
          dmThreads={dmThreads}
          dmsLoading={dmsLoading}
          dmsError={dmsError}
          me={me}
          displayNameOf={displayNameOf}
          presenceOf={presenceOf}
          activeConversation={activeConversation}
          onSelectConversation={(conversation) => {
            setActiveConversation(conversation);
            setDetailsOpen(false);
          }}
        />
      </div>
      <div className={cn("min-h-0", showDetails ? "col-span-3" : "col-span-5")}>
        {activeChannel ? (
          <ChannelChatPane
            channel={activeChannel}
            me={me}
            displayNameOf={displayNameOf}
            detailsOpen={showDetails}
            onToggleDetails={() => setDetailsOpen((open) => !open)}
          />
        ) : activeThread ? (
          <DmChatPane
            thread={activeThread}
            me={me}
            displayNameOf={displayNameOf}
            presenceOf={presenceOf}
          />
        ) : channelsLoading ? (
          <EmptyChatPane message="Loading conversations…" />
        ) : channelsError ? (
          <EmptyChatPane message="Could not load conversations. Try refreshing." />
        ) : (
          <EmptyChatPane message="Select a conversation to start messaging." />
        )}
      </div>
      {showDetails && activeChannel && (
        <div className="col-span-2 min-h-0">
          <DetailsPane channel={activeChannel} />
        </div>
      )}
    </div>
  );
}
