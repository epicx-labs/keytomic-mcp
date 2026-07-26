import { type ServerType, serve } from "@hono/node-server";
import { createMcpHonoApp } from "@modelcontextprotocol/hono";
import type { Context, Hono } from "hono";
import { type AppConfig, loadConfig } from "./config.js";
import { createCrawlerHttpAdapter } from "./crawler/http-adapter.js";
import type { CrawlerPort } from "./crawler/port.js";
import { createKeytomicMcpHandler } from "./mcp/module.js";

/** Dependencies required by the HTTP application. */
export interface ServerApplicationOptions {
  /** Crawler capability used by the mounted MCP tools. */
  crawler: CrawlerPort;
}

/** Optional dependencies used to start the production process. */
export interface StartServerOptions {
  /** Prevalidated configuration, normally loaded from the environment. */
  config?: AppConfig;
  /** Fetch override intended for process-level tests. */
  fetch?: typeof globalThis.fetch;
}

/**
 * Creates the public HTTP application without opening a network socket.
 */
export function createServerApplication({
  crawler,
}: ServerApplicationOptions): Hono {
  const app = createMcpHonoApp({ host: "0.0.0.0" });
  const mcp = createKeytomicMcpHandler(crawler);

  /**
   * Returns the process health signal used by Dokploy.
   */
  function handleHealth(context: Context): Response {
    return context.json({ status: "ok" });
  }

  /**
   * Delegates the public root endpoint to the stateless MCP handler.
   */
  async function handleMcp(context: Context): Promise<Response> {
    return mcp.fetch(context.req.raw, {
      parsedBody: context.get("parsedBody"),
    });
  }

  app.get("/health", handleHealth);
  app.all("/", handleMcp);

  return app;
}

/**
 * Starts the production Node HTTP server.
 */
export function startServer(options: StartServerOptions = {}): ServerType {
  const config = options.config ?? loadConfig();
  const crawler =
    options.fetch === undefined
      ? createCrawlerHttpAdapter({
          baseUrl: config.crawlerApiBaseUrl,
          token: config.crawlerApiToken,
        })
      : createCrawlerHttpAdapter({
          baseUrl: config.crawlerApiBaseUrl,
          fetch: options.fetch,
          token: config.crawlerApiToken,
        });
  const app = createServerApplication({ crawler });

  return serve({
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: config.port,
  });
}

if (import.meta.main) {
  startServer();
}
