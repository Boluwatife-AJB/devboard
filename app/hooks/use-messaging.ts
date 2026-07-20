"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql/client";
import { CHANNEL_QUERY } from "@/lib/graphql/documents";
import type { ApiChannel } from "@/types";

export const useChannels = () => {
  return useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const data = await graphqlRequest<{ channels: ApiChannel[] }>(
        CHANNEL_QUERY,
      );
      return data.channels;
    },
  });
};

// export const createChannel = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async(),
//   });
// };
