"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  ADD_CHANNEL_MEMBER_MUTATION,
  ADD_REACTION_MUTATION,
  CHANNEL_MEMBERS_QUERY,
  CHANNEL_MESSAGES_QUERY,
  CHANNELS_QUERY,
  CREATE_CHANNEL_MUTATION,
  DELETE_MESSAGE_MUTATION,
  DM_MESSAGES_QUERY,
  DM_THREADS_QUERY,
  EDIT_MESSAGE_MUTATION,
  JOIN_CHANNEL_MUTATION,
  LEAVE_CHANNEL_MUTATION,
  MARK_CHANNEL_AS_READ_MUTATION,
  MARK_DM_AS_READ_MUTATION,
  OPEN_DM_MUTATION,
  REMOVE_CHANNEL_MEMBER_MUTATION,
  REMOVE_REACTION_MUTATION,
  SEND_DM_MUTATION,
  SEND_MESSAGE_MUTATION,
} from "@/lib/graphql/documents";
import type {
  ApiChannel,
  ApiChannelMember,
  ApiDmMessage,
  ApiDmThread,
  ApiMessage,
  ApiReactionSummary,
  CreateChannelInput,
  DeleteMessageInput,
  EditMessageInput,
  MarkChannelAsReadInput,
  ReactionInput,
  SendDmInput,
  SendMessageInput,
} from "@/types";

export const messagingKeys = {
  channels: ["channels"] as const,
  channelMembers: (channelId: string) => ["channelMembers", channelId] as const,
  channelMessages: (channelId: string) =>
    ["channelMessages", channelId] as const,
  dmThreads: ["dmThreads"] as const,
  dmMessages: (threadId: string) => ["dmMessages", threadId] as const,
};

export function useChannels() {
  return useQuery({
    queryKey: messagingKeys.channels,
    queryFn: async () => {
      const data = await graphqlRequest<{ channels: ApiChannel[] }>(
        CHANNELS_QUERY,
      );
      return data.channels;
    },
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChannelInput) => {
      const data = await graphqlRequest<{ createChannel: ApiChannel }>(
        CREATE_CHANNEL_MUTATION,
        { input },
      );
      return data.createChannel;
    },
    onSuccess: (channel) => {
      queryClient.setQueryData<ApiChannel[]>(
        messagingKeys.channels,
        (channels) => (channels ? [...channels, channel] : [channel]),
      );
      queryClient.invalidateQueries({ queryKey: messagingKeys.channels });
    },
  });
}

export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      await graphqlRequest<{ joinChannel: boolean }>(JOIN_CHANNEL_MUTATION, {
        channelId,
      });
      return channelId;
    },
    onSuccess: (channelId) => {
      queryClient.setQueryData<ApiChannel[]>(
        messagingKeys.channels,
        (channels) =>
          channels?.map((channel) =>
            channel.id === channelId ? { ...channel, isMember: true } : channel,
          ),
      );
      queryClient.invalidateQueries({ queryKey: messagingKeys.channels });
      queryClient.invalidateQueries({
        queryKey: messagingKeys.channelMessages(channelId),
      });
    },
  });
}

export function useChannelMembers(channelId: string) {
  return useQuery({
    queryKey: messagingKeys.channelMembers(channelId),
    queryFn: async () => {
      const data = await graphqlRequest<{
        channelMembers: ApiChannelMember[];
      }>(CHANNEL_MEMBERS_QUERY, { channelId });
      return data.channelMembers;
    },
    enabled: Boolean(channelId),
  });
}

export function useAddChannelMember(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await graphqlRequest<{ addChannelMember: boolean }>(
        ADD_CHANNEL_MEMBER_MUTATION,
        { input: { channelId, userId } },
      );
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: messagingKeys.channelMembers(channelId),
      });
      queryClient.invalidateQueries({ queryKey: messagingKeys.channels });
    },
  });
}

export function useLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      await graphqlRequest<{ leaveChannel: boolean }>(LEAVE_CHANNEL_MUTATION, {
        channelId,
      });
      return channelId;
    },
    onSuccess: (channelId) => {
      queryClient.setQueryData<ApiChannel[]>(
        messagingKeys.channels,
        (channels) =>
          channels
            ?.map((channel) =>
              channel.id === channelId
                ? { ...channel, isMember: false }
                : channel,
            )
            .filter(
              (channel) => channel.id !== channelId || channel.kind === "OPEN",
            ),
      );
      queryClient.removeQueries({
        queryKey: messagingKeys.channelMembers(channelId),
      });
      queryClient.removeQueries({
        queryKey: messagingKeys.channelMessages(channelId),
      });
      queryClient.invalidateQueries({ queryKey: messagingKeys.channels });
    },
  });
}

export function useRemoveChannelMember(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await graphqlRequest<{ removeChannelMember: boolean }>(
        REMOVE_CHANNEL_MEMBER_MUTATION,
        { input: { channelId, userId } },
      );
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.setQueryData<ApiChannelMember[]>(
        messagingKeys.channelMembers(channelId),
        (members) => members?.filter((member) => member.userId !== userId),
      );
    },
  });
}

export function useChannelMessages(channelId: string) {
  return useQuery({
    queryKey: messagingKeys.channelMessages(channelId),
    queryFn: async () => {
      const data = await graphqlRequest<{ channelMessages: ApiMessage[] }>(
        CHANNEL_MESSAGES_QUERY,
        { channelId },
      );
      return data.channelMessages;
    },
    enabled: Boolean(channelId),
  });
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<SendMessageInput, "channelId">) => {
      const data = await graphqlRequest<{ sendMessage: ApiMessage }>(
        SEND_MESSAGE_MUTATION,
        { input: { ...input, channelId } },
      );
      return data.sendMessage;
    },
    onSuccess: (message) => {
      queryClient.setQueryData<ApiMessage[]>(
        messagingKeys.channelMessages(channelId),
        (messages) => {
          if (!messages) return [message];
          const exists = messages.some((item) => item.id === message.id);
          return exists
            ? messages.map((item) => (item.id === message.id ? message : item))
            : [...messages, message];
        },
      );
    },
  });
}

export function useEditMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditMessageInput) => {
      const data = await graphqlRequest<{ editMessage: ApiMessage }>(
        EDIT_MESSAGE_MUTATION,
        { input },
      );
      return data.editMessage;
    },
    onSuccess: (message) => {
      queryClient.setQueryData<ApiMessage[]>(
        messagingKeys.channelMessages(channelId),
        (messages) =>
          messages?.map((item) => (item.id === message.id ? message : item)),
      );
    },
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteMessageInput) => {
      await graphqlRequest<{ deleteMessage: boolean }>(
        DELETE_MESSAGE_MUTATION,
        { input },
      );
      return input.messageId;
    },
    onSuccess: (messageId) => {
      queryClient.setQueryData<ApiMessage[]>(
        messagingKeys.channelMessages(channelId),
        (messages) => messages?.filter((message) => message.id !== messageId),
      );
    },
  });
}

export function useAddReaction(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReactionInput) => {
      const data = await graphqlRequest<{
        addReaction: ApiReactionSummary[];
      }>(ADD_REACTION_MUTATION, { input });
      return { messageId: input.messageId, reactions: data.addReaction };
    },
    onSuccess: ({ messageId, reactions }) => {
      queryClient.setQueryData<ApiMessage[]>(
        messagingKeys.channelMessages(channelId),
        (messages) =>
          messages?.map((message) =>
            message.id === messageId ? { ...message, reactions } : message,
          ),
      );
    },
  });
}

export function useRemoveReaction(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReactionInput) => {
      const data = await graphqlRequest<{
        removeReaction: ApiReactionSummary[];
      }>(REMOVE_REACTION_MUTATION, { input });
      return { messageId: input.messageId, reactions: data.removeReaction };
    },
    onSuccess: ({ messageId, reactions }) => {
      queryClient.setQueryData<ApiMessage[]>(
        messagingKeys.channelMessages(channelId),
        (messages) =>
          messages?.map((message) =>
            message.id === messageId ? { ...message, reactions } : message,
          ),
      );
    },
  });
}

export function useMarkChannelAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MarkChannelAsReadInput) => {
      await graphqlRequest<{ markChannelAsRead: boolean }>(
        MARK_CHANNEL_AS_READ_MUTATION,
        { input },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.channels });
    },
  });
}

export function useDmThreads() {
  return useQuery({
    queryKey: messagingKeys.dmThreads,
    queryFn: async () => {
      const data = await graphqlRequest<{ dmThreads: ApiDmThread[] }>(
        DM_THREADS_QUERY,
      );
      return data.dmThreads;
    },
  });
}

export function useOpenDm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const data = await graphqlRequest<{ openDm: ApiDmThread }>(
        OPEN_DM_MUTATION,
        { otherUserId },
      );
      return data.openDm;
    },
    onSuccess: (thread) => {
      queryClient.setQueryData<ApiDmThread[]>(
        messagingKeys.dmThreads,
        (threads) => {
          if (!threads) return [thread];
          const exists = threads.some((item) => item.id === thread.id);
          return exists ? threads : [...threads, thread];
        },
      );
      queryClient.invalidateQueries({ queryKey: messagingKeys.dmThreads });
    },
  });
}

export function useDmMessages(threadId: string) {
  return useQuery({
    queryKey: messagingKeys.dmMessages(threadId),
    queryFn: async () => {
      const data = await graphqlRequest<{ dmMessages: ApiDmMessage[] }>(
        DM_MESSAGES_QUERY,
        { threadId },
      );
      return data.dmMessages;
    },
    enabled: Boolean(threadId),
  });
}

export function useSendDm(threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<SendDmInput, "threadId">) => {
      const data = await graphqlRequest<{ sendDm: ApiDmMessage }>(
        SEND_DM_MUTATION,
        { input: { ...input, threadId } },
      );
      return data.sendDm;
    },
    onSuccess: (message) => {
      queryClient.setQueryData<ApiDmMessage[]>(
        messagingKeys.dmMessages(threadId),
        (messages) => {
          if (!messages) return [message];
          const exists = messages.some((item) => item.id === message.id);
          return exists
            ? messages.map((item) => (item.id === message.id ? message : item))
            : [...messages, message];
        },
      );
    },
  });
}

export function useMarkDmAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (threadId: string) => {
      await graphqlRequest<{ markDmAsRead: boolean }>(
        MARK_DM_AS_READ_MUTATION,
        { threadId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.dmThreads });
    },
  });
}
