"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChannelChatPane } from "@/components/messages/channel-chat-pane";
import { DetailsPane } from "@/components/messages/details-pane";
import { DmChatPane } from "@/components/messages/dm-chat-pane";
import { EmptyChatPane } from "@/components/messages/list-states";
import { WorkspaceNav } from "@/components/messages/workspace-nav";
import { useMe } from "@/hooks/use-me";
import { useChannels, useDmThreads } from "@/hooks/use-messaging";
import { useOrgPresence } from "@/hooks/use-presence";
import { useOrgMembers } from "@/hooks/use-teams";
import { toUiPresence } from "@/lib/message-utils";
import { cn } from "@/lib/utils";
import type { ActiveConversation, ApiUser } from "@/types";

export function MessagesView() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);

  const { data: me } = useMe();
  const { data: members = [] } = useOrgMembers();
  const { data: presence = {} } = useOrgPresence();
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
