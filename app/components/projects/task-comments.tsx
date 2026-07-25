"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChatTextIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/use-comments";
import { useMe } from "@/hooks/use-me";
import { getApiErrorMessage } from "@/lib/api";
import { createCommentSchema } from "@/lib/schema";
import { avatarColorOf, formatRelativeTime, initialsOf } from "@/lib/task-ui";
import type { ApiComment, CreateCommentFormData } from "@/types";

function CommentItem({
  comment,
  canDelete,
  onDelete,
  isDeleting,
}: {
  comment: ApiComment;
  canDelete: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const name = comment.author?.displayName ?? "Unknown user";

  return (
    <div className="flex gap-3">
      <Avatar className="size-8">
        <AvatarFallback
          className="text-[10px] text-white"
          style={{ backgroundColor: avatarColorOf(comment.authorId) }}
        >
          {initialsOf(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className="text-xs text-[#8A8A8A]">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-xs italic text-[#8A8A8A]">(edited)</span>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto size-6 text-[#8A8A8A] hover:text-[#FF6B6B]"
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
              aria-label="Delete comment"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-[#E5E5E5]">
          {comment.body}
        </p>
      </div>
    </div>
  );
}

export function TaskComments({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const { data: comments, isPending } = useComments(projectId, taskId);
  const { data: me } = useMe();
  const createComment = useCreateComment(projectId, taskId);
  const deleteComment = useDeleteComment(projectId, taskId);

  const { control, handleSubmit, reset } = useForm<CreateCommentFormData>({
    resolver: zodResolver(createCommentSchema),
    mode: "onSubmit",
    defaultValues: { body: "" },
  });

  const onSubmit = async (data: CreateCommentFormData) => {
    try {
      await createComment.mutateAsync({ body: data.body });
      reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate(commentId, {
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const total = comments?.length ?? 0;

  return (
    <Card className="gap-0 rounded-xs border border-[#2A2A2A] bg-[#131313] py-0 ring-0">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChatTextIcon className="size-4 text-[#4D8EFF]" weight="fill" />
            <h2 className="text-sm font-semibold text-white">Comments</h2>
          </div>
          <Badge
            variant="outline"
            className="h-6 rounded-xs border-[#2A2A2A] px-2 text-[10px] font-mono text-[#C2C6D6]"
          >
            {total} Total
          </Badge>
        </div>

        <div className="flex flex-col gap-6">
          {isPending && <p className="text-xs text-[#8A8A8A]">Loading…</p>}

          {!isPending && total === 0 && (
            <p className="text-sm italic text-[#8A8A8A]">
              No comments yet. Start the conversation.
            </p>
          )}

          {comments?.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={me?.id === comment.authorId}
              onDelete={handleDelete}
              isDeleting={deleteComment.isPending}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-3">
            <Controller
              control={control}
              name="body"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <Textarea
                    placeholder="Write a comment... (Markdown supported)"
                    rows={3}
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createComment.isPending}>
                {createComment.isPending && (
                  <Spinner data-icon="inline-start" />
                )}
                Comment
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
