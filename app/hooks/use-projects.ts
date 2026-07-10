"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  CREATE_PROJECT_MUTATION,
  PROJECT_QUERY,
  PROJECTS_QUERY,
} from "@/lib/graphql/documents";
import type { ApiProject, CreateProjectInput } from "@/types";

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
