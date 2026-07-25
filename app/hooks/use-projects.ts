"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  ADD_PROJECT_MEMBER_MUTATION,
  CREATE_PROJECT_MUTATION,
  DELETE_PROJECT_MUTATION,
  PROJECT_QUERY,
  PROJECTS_QUERY,
  UPDATE_PROJECT_MUTATION,
} from "@/lib/graphql/documents";
import type {
  AddProjectMemberInput,
  ApiProject,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/types";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const data = await graphqlRequest<{ projects: ApiProject[] }>(
        PROJECTS_QUERY,
      );
      return data.projects;
    },
  });
}

export function useProject(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const data = await graphqlRequest<{ project: ApiProject }>(
        PROJECT_QUERY,
        { id },
      );
      return data.project;
    },
    initialData: () =>
      queryClient
        .getQueryData<ApiProject[]>(projectKeys.all)
        ?.find((project) => project.id === id),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const data = await graphqlRequest<{ createProject: ApiProject }>(
        CREATE_PROJECT_MUTATION,
        { input },
      );
      return data.createProject;
    },
    onSuccess: (project) => {
      queryClient.setQueryData<ApiProject[]>(projectKeys.all, (previous) =>
        previous ? [...previous, project] : [project],
      );
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<UpdateProjectInput, "projectId">) => {
      const data = await graphqlRequest<{ updateProject: ApiProject }>(
        UPDATE_PROJECT_MUTATION,
        { input: { ...input, projectId } },
      );
      return data.updateProject;
    },
    onSuccess: (project) => {
      queryClient.setQueryData<ApiProject>(
        projectKeys.detail(projectId),
        project,
      );
      queryClient.setQueryData<ApiProject[]>(
        projectKeys.all,
        (previous) =>
          previous?.map((p) => (p.id === projectId ? project : p)) ?? [],
      );
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await graphqlRequest<{ deleteProject: boolean }>(
        DELETE_PROJECT_MUTATION,
        { projectId },
      );
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.setQueryData<ApiProject[]>(
        projectKeys.all,
        (previous) => previous?.filter((p) => p.id !== projectId) ?? [],
      );
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<AddProjectMemberInput, "projectId">) => {
      const data = await graphqlRequest<{ addProjectMember: boolean }>(
        ADD_PROJECT_MEMBER_MUTATION,
        { input: { ...input, projectId } },
      );
      return data.addProjectMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
    },
  });
}
