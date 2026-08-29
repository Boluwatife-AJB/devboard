"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateDashboardQueries } from "@/hooks/use-dashboard";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  ASSIGN_TASK_MUTATION,
  CREATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  TASK_QUERY,
  TASKS_QUERY,
  UPDATE_TASK_STATUS_MUTATION,
} from "@/lib/graphql/documents";
import type {
  ApiTask,
  AssignTaskInput,
  CreateTaskInput,
  TaskStatus,
} from "@/types";

export const taskKeys = {
  list: (projectId: string) => ["projects", projectId, "tasks"] as const,
  detail: (projectId: string, taskId: string) =>
    ["projects", projectId, "tasks", taskId] as const,
};

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: async () => {
      const data = await graphqlRequest<{ tasks: ApiTask[] }>(TASKS_QUERY, {
        projectId,
      });
      return data.tasks;
    },
    enabled: Boolean(projectId),
  });
}

export function useTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: taskKeys.detail(projectId, taskId),
    queryFn: async () => {
      const data = await graphqlRequest<{ task: ApiTask }>(TASK_QUERY, {
        id: taskId,
        projectId,
      });
      return data.task;
    },
    initialData: () =>
      queryClient
        .getQueryData<ApiTask[]>(taskKeys.list(projectId))
        ?.find((task) => task.id === taskId),
    enabled: Boolean(projectId) && Boolean(taskId),
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateTaskInput, "projectId">) => {
      const data = await graphqlRequest<{ createTask: ApiTask }>(
        CREATE_TASK_MUTATION,
        { input: { ...input, projectId } },
      );
      return data.createTask;
    },
    onSuccess: (task) => {
      queryClient.setQueryData<ApiTask[]>(taskKeys.list(projectId), (tasks) =>
        tasks ? [...tasks, task] : [task],
      );
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
      invalidateDashboardQueries(queryClient);
    },
  });
}

/**
 * Optimistically moves the task to the new status, rolling back on error.
 */
export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();
  const listKey = taskKeys.list(projectId);

  return useMutation({
    mutationFn: async (variables: { taskId: string; status: TaskStatus }) => {
      const data = await graphqlRequest<{ updateTaskStatus: ApiTask }>(
        UPDATE_TASK_STATUS_MUTATION,
        { input: { ...variables, projectId } },
      );
      return data.updateTaskStatus;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previousTasks = queryClient.getQueryData<ApiTask[]>(listKey);

      queryClient.setQueryData<ApiTask[]>(listKey, (tasks) =>
        tasks?.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(listKey, context.previousTasks);
      }
    },
    onSuccess: (task) => {
      queryClient.setQueryData<ApiTask[]>(listKey, (tasks) =>
        tasks?.map((item) => (item.id === task.id ? task : item)),
      );
      queryClient.setQueryData(taskKeys.detail(projectId, task.id), task);
    },
  });
}

export function useAssignTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<AssignTaskInput, "projectId">) => {
      const data = await graphqlRequest<{ assignTask: ApiTask }>(
        ASSIGN_TASK_MUTATION,
        { input: { ...input, projectId } },
      );
      return data.assignTask;
    },
    onSuccess: (task) => {
      queryClient.setQueryData<ApiTask[]>(taskKeys.list(projectId), (tasks) =>
        tasks?.map((item) => (item.id === task.id ? task : item)),
      );
      queryClient.setQueryData(taskKeys.detail(projectId, task.id), task);
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await graphqlRequest<{ deleteTask: boolean }>(DELETE_TASK_MUTATION, {
        taskId,
        projectId,
      });
      return taskId;
    },
    onSuccess: (taskId) => {
      queryClient.setQueryData<ApiTask[]>(taskKeys.list(projectId), (tasks) =>
        tasks?.filter((task) => task.id !== taskId),
      );
      queryClient.removeQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
  });
}
