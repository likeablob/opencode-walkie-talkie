import type { LoaderFunctionArgs } from "react-router";

import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { router } from "~/.server/router";

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error("oRPC error:", error);
    }),
  ],
});

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[RPC loader] URL:", request.url, "Method:", request.method);
  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    context: {},
  });

  return response ?? new Response("Not Found", { status: 404 });
}

export async function action({ request }: LoaderFunctionArgs) {
  console.log("[RPC action] URL:", request.url, "Method:", request.method);
  console.log("[RPC action] Content-Type:", request.headers.get("content-type"));

  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    context: {},
  });

  return response ?? new Response("Not Found", { status: 404 });
}
