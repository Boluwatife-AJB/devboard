"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateDashboardQueries } from "@/hooks/use-dashboard";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  CANCEL_EVENT_MUTATION,
  CREATE_EVENT_MUTATION,
  EVENT_OCCURRENCE_QUERY,
  EVENTS_QUERY,
  MY_UPCOMING_EVENTS_QUERY,
} from "@/lib/graphql/documents";
import type {
  ApiEventOccurrence,
  CancelEventInput,
  CreateEventInput,
} from "@/types";

export const eventKeys = {
  all: ["events"] as const,
  list: (from: string, to: string) => ["events", "list", from, to] as const,
  upcoming: (days: number) => ["events", "upcoming", days] as const,
  detail: (id: string) => ["events", "detail", id] as const,
};

export function useEvents(from: string, to: string, limit = 100) {
  return useQuery({
    queryKey: eventKeys.list(from, to),
    queryFn: async () => {
      const data = await graphqlRequest<{ events: ApiEventOccurrence[] }>(
        EVENTS_QUERY,
        { from, to, limit },
      );
      return data.events;
    },
    enabled: Boolean(from && to),
  });
}

export function useMyUpcomingEvents(days = 14, limit = 20) {
  return useQuery({
    queryKey: eventKeys.upcoming(days),
    queryFn: async () => {
      const data = await graphqlRequest<{
        myUpcomingEvents: ApiEventOccurrence[];
      }>(MY_UPCOMING_EVENTS_QUERY, { days, limit });
      return data.myUpcomingEvents;
    },
  });
}

export function useEventOccurrence(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async () => {
      const data = await graphqlRequest<{
        eventOccurrence: ApiEventOccurrence;
      }>(EVENT_OCCURRENCE_QUERY, { id });
      return data.eventOccurrence;
    },
    enabled: Boolean(id),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const data = await graphqlRequest<{ createEvent: ApiEventOccurrence }>(
        CREATE_EVENT_MUTATION,
        { input },
      );
      return data.createEvent;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CancelEventInput) => {
      const data = await graphqlRequest<{ cancelEvent: boolean }>(
        CANCEL_EVENT_MUTATION,
        { input },
      );
      return data.cancelEvent;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}
