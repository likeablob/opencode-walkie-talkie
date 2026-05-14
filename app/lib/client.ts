import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "~/shared/contract";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

const link = new RPCLink({
  url: typeof window !== "undefined" ? `${window.location.origin}/rpc` : "/rpc",
});

export const client: ContractRouterClient<typeof contract> = createORPCClient(link);
