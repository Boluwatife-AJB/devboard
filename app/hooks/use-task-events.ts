"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { TASK_UPDATED_SUBSCRIPTION } from "@/lib/graphql/documents";
import { getWsClient } from "@/lib/graphql/ws";
import type { ApiTask, TaskUpdatedEvent } from "@/types";
import { taskKeys } from "./use-tasks";

/**
 * Subscribes to the `taskUpdated` GraphQL subscription for a project and
 * keeps the React Query task caches in sync with events from other clients.
 */
export function useTaskEvents(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const listKey = taskKeys.list(projectId);

    const dispose = getWsClient().subscribe<{ taskUpdated: TaskUpdatedEvent }>(
      {
        query: TASK_UPDATED_SUBSCRIPTION,
        variables: { projectId },
      },
      {
        next: (result) => {
          const event = result.data?.taskUpdated;
          if (!event) return;

          if (event.kind === "DELETED") {
            queryClient.setQueryData<ApiTask[]>(listKey, (tasks) =>
              tasks?.filter((task) => task.id !== event.taskId),
            );
            queryClient.removeQueries({
              queryKey: taskKeys.detail(projectId, event.taskId),
            });
            return;
          }

          const task = event.task;
          if (!task) return;

          queryClient.setQueryData<ApiTask[]>(listKey, (tasks) => {
            if (!tasks) return tasks;
            const exists = tasks.some((item) => item.id === task.id);
            return exists
              ? tasks.map((item) => (item.id === task.id ? task : item))
              : [...tasks, task];
          });
          queryClient.setQueryData(taskKeys.detail(projectId, task.id), task);
        },
        // Live updates are an enhancement; never break the page over them
        error: (error) => {
          console.warn("task subscription error", error);
        },
        complete: () => {},
      },
    );

    return dispose;
  }, [projectId, queryClient]);
}
