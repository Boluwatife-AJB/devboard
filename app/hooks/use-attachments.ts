"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  ADD_ATTACHMENT_MUTATION,
  ATTACHMENTS_QUERY,
  REMOVE_ATTACHMENT_MUTATION,
} from "@/lib/graphql/documents";
import type { AddAttachmentInput, ApiAttachment } from "@/types";
import { taskKeys } from "./use-tasks";

export const attachmentKeys = {
  list: (projectId: string, taskId: string) =>
    [...taskKeys.detail(projectId, taskId), "attachments"] as const,
};

export function useAttachments(projectId: string, taskId: string) {
  return useQuery({
    queryKey: attachmentKeys.list(projectId, taskId),
    queryFn: async () => {
      const data = await graphqlRequest<{ attachments: ApiAttachment[] }>(
        ATTACHMENTS_QUERY,
        { taskId, projectId },
      );
      return data.attachments;
    },
    enabled: Boolean(projectId) && Boolean(taskId),
  });
}

export function useAddAttachment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<AddAttachmentInput, "projectId">) => {
      const data = await graphqlRequest<{ addAttachment: ApiAttachment }>(
        ADD_ATTACHMENT_MUTATION,
        { input: { ...input, projectId } },
      );
      return data.addAttachment;
    },
    onSuccess: (attachment) => {
      queryClient.setQueryData<ApiAttachment[]>(
        attachmentKeys.list(projectId, attachment.taskId),
        (attachments) =>
          attachments ? [...attachments, attachment] : [attachment],
      );
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(projectId, attachment.taskId),
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(projectId, attachment.taskId),
      });
    },
  });
}

export function useRemoveAttachment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await graphqlRequest<{ removeAttachment: boolean }>(
        REMOVE_ATTACHMENT_MUTATION,
        { attachmentId, projectId },
      );
      return attachmentId;
    },
    onSuccess: (attachmentId) => {
      queryClient.setQueryData<ApiAttachment[]>(
        attachmentKeys.list(projectId, taskId),
        (attachments) =>
          attachments?.filter((attachment) => attachment.id !== attachmentId),
      );
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
  });
}
