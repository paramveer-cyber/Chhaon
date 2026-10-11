import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { ApiError } from "@repo/services/api-response";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";

const trpcErrorCodeByStatusCode: Record<number, TRPC_ERROR_CODE_KEY> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "TOO_MANY_REQUESTS",
};

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({
    errorFormatter: ({ shape }) => ({ ...shape, data: { ...shape.data, stack: undefined } }),
  });

export const router = tRPCContext.router;

const translateApiError = tRPCContext.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok && result.error.cause instanceof ApiError) {
    const { statusCode, message } = result.error.cause;
    throw new TRPCError({ code: trpcErrorCodeByStatusCode[statusCode] ?? "INTERNAL_SERVER_ERROR", message });
  }
  return result;
});

export const publicProcedure = tRPCContext.procedure.use(translateApiError);
