"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  COMMENTS_QUERY,
  CREATE_COMMENT_MUTATION,
  DELETE_COMMENT_MUTATION,
} from "@/lib/graphql/documents";
import type { ApiComment, CreateCommentInput } from "@/types";
import { taskKeys } from "./use-tasks";

export const commentKeys = {
  list: (projectId: string, taskId: string) =>
    [...taskKeys.detail(projectId, taskId), "comments"] as const,
};

export function useComments(projectId: string, taskId: string) {
  return useQuery({
    queryKey: commentKeys.list(projectId, taskId),
    queryFn: async () => {
      const data = await graphqlRequest<{ comments: ApiComment[] }>(
        COMMENTS_QUERY,
        { taskId, projectId },
      );
      return data.comments;
    },
    enabled: Boolean(projectId) && Boolean(taskId),
  });
}

export function useCreateComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<CreateCommentInput, "projectId" | "taskId">,
    ) => {
      const data = await graphqlRequest<{ createComment: ApiComment }>(
        CREATE_COMMENT_MUTATION,
        { input: { ...input, projectId, taskId } },
      );
      return data.createComment;
    },
    onSuccess: (comment) => {
      queryClient.setQueryData<ApiComment[]>(
        commentKeys.list(projectId, taskId),
        (comments) => (comments ? [...comments, comment] : [comment]),
      );
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(projectId, taskId),
      });
    },
  });
}

export function useDeleteComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await graphqlRequest<{ deleteComment: boolean }>(
        DELETE_COMMENT_MUTATION,
        { commentId, projectId },
      );
      return commentId;
    },
    onSuccess: (commentId) => {
      queryClient.setQueryData<ApiComment[]>(
        commentKeys.list(projectId, taskId),
        (comments) => comments?.filter((comment) => comment.id !== commentId),
      );
    },
  });
}
