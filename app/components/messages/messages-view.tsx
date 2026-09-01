"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChannelChatPane } from "@/components/messages/channel-chat-pane";
import { DetailsPane } from "@/components/messages/details-pane";
import { DmChatPane } from "@/components/messages/dm-chat-pane";
import { EmptyChatPane } from "@/components/messages/list-states";
import { WorkspaceNav } from "@/components/messages/workspace-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMe } from "@/hooks/use-me";
import {
  useChannels,
  useDmThreads,
  useJoinChannel,
} from "@/hooks/use-messaging";
import { memberDisplayName, useOrgMemberMap } from "@/hooks/use-org-member-map";
import { useOrgPresence } from "@/hooks/use-presence";
import { getApiErrorMessage } from "@/lib/api";
import { toUiPresence } from "@/lib/message-utils";
import { cn } from "@/lib/utils";
import type { ActiveConversation, ApiChannel } from "@/types";

export function MessagesView() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);
  const [pendingJoinChannel, setPendingJoinChannel] =
    useState<ApiChannel | null>(null);

  const { data: me } = useMe();
  const memberMap = useOrgMemberMap();
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
  const joinChannel = useJoinChannel();

  const displayNameOf = useCallback(
    (userId: string) => memberDisplayName(memberMap, userId),
    [memberMap],
  );

  const presenceOf = useCallback(
    (userId: string) => toUiPresence(presence[userId]),
    [presence],
  );

  useEffect(() => {
    if (activeConversation) return;
    const firstMemberChannel = channels.find((channel) => channel.isMember);
    if (firstMemberChannel) {
      setActiveConversation({ type: "channel", id: firstMemberChannel.id });
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

  const showDetails =
    detailsOpen && activeChannel !== null && activeChannel.isMember;

  const handleSelectConversation = (conversation: ActiveConversation) => {
    if (conversation.type === "channel") {
      const channel = channels.find((item) => item.id === conversation.id);
      if (channel && !channel.isMember) {
        setPendingJoinChannel(channel);
        return;
      }
    }
    setActiveConversation(conversation);
    setDetailsOpen(false);
  };

  const handleConfirmJoin = async () => {
    if (!pendingJoinChannel) return;
    const channelId = pendingJoinChannel.id;
    try {
      await joinChannel.mutateAsync(channelId);
      setPendingJoinChannel(null);
      setActiveConversation({ type: "channel", id: channelId });
      setDetailsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

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
          onSelectConversation={handleSelectConversation}
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
          <DetailsPane
            channel={activeChannel}
            onLeftChannel={() => {
              setDetailsOpen(false);
              setActiveConversation(null);
            }}
          />
        </div>
      )}

      <AlertDialog
        open={pendingJoinChannel !== null}
        onOpenChange={(open) => {
          if (!open) setPendingJoinChannel(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Join #{pendingJoinChannel?.slug}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are not a member of this channel yet. Join to read and send
              messages in #{pendingJoinChannel?.slug}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={joinChannel.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmJoin}
              disabled={joinChannel.isPending}
            >
              {joinChannel.isPending ? "Joining…" : "Join channel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
