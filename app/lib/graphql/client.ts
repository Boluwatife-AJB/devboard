import { GRAPHQL_HTTP_URL, privateApi } from "@/lib/api";

export interface GraphQLErrorItem {
  message: string;
  extensions?: {
    code?: string;
  };
}

export class GraphQLRequestError extends Error {
  readonly errors: GraphQLErrorItem[];

  constructor(errors: GraphQLErrorItem[]) {
    super(errors[0]?.message ?? "GraphQL request failed");
    this.name = "GraphQLRequestError";
    this.errors = errors;
  }
}

/**
 * Executes a GraphQL operation against the backend using the authenticated
 * axios instance (Bearer token + X-Organization-Id headers are attached by
 * its interceptors) and unwraps the GraphQL response envelope.
 */
export async function graphqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const response = await privateApi.post<{
    data?: TData;
    errors?: GraphQLErrorItem[];
  }>(GRAPHQL_HTTP_URL, { query, variables });

  const { data, errors } = response.data;

  if (errors && errors.length > 0) {
    throw new GraphQLRequestError(errors);
  }

  if (data == null) {
    throw new GraphQLRequestError([{ message: "Empty GraphQL response" }]);
  }

  return data;
}
