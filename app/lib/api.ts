import axios from "axios";
import { getAccessToken, getSelectedOrgId } from "./auth/cookies";
import { logout } from "./auth/session";

/** Extract a human-readable message from an axios/network/unknown error. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Unable to reach the server. Please try again.";
    }
    const data = error.response.data;
    if (typeof data === "string" && data.length > 0) {
      return data;
    }
    if (data && typeof data === "object") {
      const message = (data as { message?: unknown; error?: unknown }).message;
      if (typeof message === "string") return message;
      const err = (data as { error?: unknown }).error;
      if (typeof err === "string") return err;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const GRAPHQL_HTTP_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? `${API_BASE_URL}/graphql`;

export const GRAPHQL_WS_URL = `${GRAPHQL_HTTP_URL.replace(/^http/, "ws")}/ws`;

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const privateApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

privateApi.interceptors.request.use(
  (config) => {
    const authToken = getAccessToken();
    const orgId = getSelectedOrgId();

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (orgId) {
      config.headers["X-Organization-Id"] = orgId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// For 401 errors, redirect to the sign-in page
privateApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    logout();
    return Promise.reject(error);
  },
);
