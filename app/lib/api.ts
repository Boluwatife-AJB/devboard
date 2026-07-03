import axios from "axios";
import { clearAuth, getAccessToken, getSelectedOrgId } from "./auth/cookies";

export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const privateApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT,
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
    if (error.response.status === 401) {
      clearAuth();
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  },
);
