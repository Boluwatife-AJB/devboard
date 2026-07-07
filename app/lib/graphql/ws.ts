import { type Client, createClient } from "graphql-ws";
import { GRAPHQL_WS_URL } from "@/lib/api";
import { getAccessToken, getSelectedOrgId } from "@/lib/auth/cookies";

let wsClient: Client | null = null;

/**
 * Lazily-created singleton graphql-ws client. The connection is only opened
 * once a subscription is started, and auth is passed via connectionParams
 * since browsers cannot set headers on WebSocket upgrade requests.
 */
export function getWsClient(): Client {
  if (!wsClient) {
    wsClient = createClient({
      url: GRAPHQL_WS_URL,
      lazy: true,
      retryAttempts: 5,
      shouldRetry: () => true,
      connectionParams: () => {
        const token = getAccessToken();
        const orgId = getSelectedOrgId();
        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(orgId ? { "X-Organization-Id": orgId } : {}),
        };
      },
    });
  }
  return wsClient;
}
