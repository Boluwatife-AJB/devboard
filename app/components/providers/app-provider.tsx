"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/query-client";

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProgressProvider
        height="2px"
        color="#6366f1"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {children}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
        <Toaster position="top-right" richColors closeButton />
      </ProgressProvider>
    </QueryClientProvider>
  );
}
