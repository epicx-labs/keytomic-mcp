import type { z } from "zod";
import {
  type AuditCategory,
  type AuditCategoryResult,
  type AuditStatusResult,
  type AuditSummaryResult,
  auditCategoryResultSchema,
  auditStatusResultSchema,
  auditSummaryResultSchema,
  CrawlerApiError,
  type StartAuditResult,
  startAuditResultSchema,
} from "./contracts.js";
import type { CrawlerPort } from "./port.js";

const QUICK_AUDIT_CATEGORIES: readonly AuditCategory[] = [
  "crawlability",
  "indexability",
  "metadata",
];

/** Dependencies and settings for the crawler HTTP adapter. */
export interface CrawlerHttpAdapterOptions {
  /** Crawler API origin without an endpoint path. */
  baseUrl: string;
  /** Fetch implementation, injectable only at the remote test seam. */
  fetch?: typeof globalThis.fetch;
  /** Maximum duration of one crawler request in milliseconds. */
  timeoutMs?: number;
  /** Internal bearer token used only between services. */
  token: string;
}

/** HTTP-backed implementation of the crawler capability port. */
class CrawlerHttpAdapter implements CrawlerPort {
  /** Normalized crawler API origin. */
  readonly #baseUrl: string;

  /** Fetch implementation used for outbound calls. */
  readonly #fetch: typeof globalThis.fetch;

  /** Maximum duration of one outbound call. */
  readonly #timeoutMs: number;

  /** Internal crawler API bearer token. */
  readonly #token: string;

  /**
   * Creates an adapter for one crawler API deployment.
   */
  constructor(options: CrawlerHttpAdapterOptions) {
    this.#baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.#timeoutMs = options.timeoutMs ?? 10_000;
    this.#token = options.token;
  }

  /**
   * Starts the fixed 25-page Quick Audit.
   */
  async startWebsiteAudit(url: string): Promise<StartAuditResult> {
    return this.#request("POST", "/v2/audits", startAuditResultSchema, {
      categories: QUICK_AUDIT_CATEGORIES,
      maxPages: 25,
      url,
    });
  }

  /**
   * Reads current progress for one Audit Job.
   */
  async getAuditStatus(auditId: string): Promise<AuditStatusResult> {
    return this.#request(
      "GET",
      `/v2/audits/${encodeURIComponent(auditId)}`,
      auditStatusResultSchema,
    );
  }

  /**
   * Reads the completed summary for one Audit Job.
   */
  async getAuditSummary(auditId: string): Promise<AuditSummaryResult> {
    return this.#request(
      "GET",
      `/v2/audits/${encodeURIComponent(auditId)}/summary`,
      auditSummaryResultSchema,
    );
  }

  /**
   * Reads one 20-item category page for an Audit Job.
   */
  async getAuditCategory(
    auditId: string,
    category: AuditCategory,
    cursor?: string,
  ): Promise<AuditCategoryResult> {
    const query = new URLSearchParams({ limit: "20" });
    if (cursor !== undefined) {
      query.set("cursor", cursor);
    }

    return this.#request(
      "GET",
      `/v2/audits/${encodeURIComponent(
        auditId,
      )}/categories/${encodeURIComponent(category)}?${query.toString()}`,
      auditCategoryResultSchema,
    );
  }

  /**
   * Performs, classifies, and validates one crawler API request.
   */
  async #request<Schema extends z.ZodType>(
    method: "GET" | "POST",
    path: string,
    schema: Schema,
    body?: object,
  ): Promise<z.output<Schema>> {
    let response: Response;

    try {
      const request: RequestInit = {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${this.#token}`,
          "content-type": "application/json",
        },
        method,
        signal: AbortSignal.timeout(this.#timeoutMs),
      };
      if (body !== undefined) {
        request.body = JSON.stringify(body);
      }

      response = await this.#fetch(`${this.#baseUrl}${path}`, request);
    } catch (error) {
      throw new CrawlerApiError("Crawler API is unavailable.", {
        cause: error,
        code: "crawler_unavailable",
      });
    }

    if (!response.ok) {
      throw createResponseError(response);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new CrawlerApiError("Crawler API returned invalid JSON.", {
        cause: error,
        code: "invalid_crawler_response",
        status: response.status,
      });
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new CrawlerApiError("Crawler API returned an invalid response.", {
        cause: parsed.error,
        code: "invalid_crawler_response",
        status: response.status,
      });
    }

    return parsed.data;
  }
}

/**
 * Maps an unsuccessful crawler response to the stable internal vocabulary.
 */
function createResponseError(response: Response): CrawlerApiError {
  if (response.status === 404 || response.status === 410) {
    return new CrawlerApiError("Audit was not found or has expired.", {
      code: "not_found_or_expired",
      status: response.status,
    });
  }

  if (response.status === 409 || response.status === 425) {
    return new CrawlerApiError("Audit is not ready.", {
      code: "audit_not_ready",
      status: response.status,
    });
  }

  if (response.status === 429) {
    const retryAfterSeconds = parseRetryAfter(
      response.headers.get("retry-after"),
    );
    return new CrawlerApiError(
      "Crawler capacity is temporarily exhausted.",
      retryAfterSeconds === undefined
        ? {
            code: "capacity_rejected",
            status: response.status,
          }
        : {
            code: "capacity_rejected",
            retryAfterSeconds,
            status: response.status,
          },
    );
  }

  return new CrawlerApiError("Crawler API is unavailable.", {
    code: "crawler_unavailable",
    status: response.status,
  });
}

/**
 * Parses a numeric Retry-After value without trusting arbitrary header text.
 */
function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) {
    return undefined;
  }

  const seconds = Number.parseInt(value, 10);
  return Number.isSafeInteger(seconds) ? seconds : undefined;
}

/**
 * Creates the production crawler HTTP adapter.
 */
export function createCrawlerHttpAdapter(
  options: CrawlerHttpAdapterOptions,
): CrawlerPort {
  return new CrawlerHttpAdapter(options);
}
