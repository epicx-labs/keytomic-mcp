import { z } from "zod";

const environmentSchema = z.object({
  CRAWLER_API_BASE_URL: z.url({ protocol: /^https?$/ }),
  CRAWLER_API_TOKEN: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3_000),
});

/** Validated runtime configuration. */
export interface AppConfig {
  /** Crawler API origin without a trailing slash. */
  crawlerApiBaseUrl: string;
  /** Internal crawler API bearer token. */
  crawlerApiToken: string;
  /** Public HTTP listening port. */
  port: number;
}

/**
 * Parses runtime configuration once and fails fast on invalid values.
 */
export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsed = environmentSchema.parse(environment);

  return {
    crawlerApiBaseUrl: parsed.CRAWLER_API_BASE_URL.replace(/\/+$/, ""),
    crawlerApiToken: parsed.CRAWLER_API_TOKEN,
    port: parsed.PORT,
  };
}
