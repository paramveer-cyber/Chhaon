import express from "express";
import { logger } from "@repo/logger";
import compression from "compression";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

const maximumRequestBodySize = "10kb";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "API",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(compression());
app.use(express.json({ limit: maximumRequestBodySize }));

app.get("/", (req, res) => {
  return res.json({ message: "API is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "API is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
