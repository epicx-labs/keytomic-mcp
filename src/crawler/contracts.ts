import { z } from "zod";

/** Categories included in every Quick Audit. */
export const auditCategorySchema = z.enum([
  "crawlability",
  "indexability",
  "metadata",
]);

/** One Quick Audit category. */
export type AuditCategory = z.infer<typeof auditCategorySchema>;

/** Lifecycle states returned by the crawler API. */
export const auditJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

/** Valid response after starting a Quick Audit. */
export const startAuditResultSchema = z.strictObject({
  auditId: z.string().min(1),
  status: z.enum(["queued", "running"]),
});

/** Result returned after starting a Quick Audit. */
export type StartAuditResult = z.infer<typeof startAuditResultSchema>;

/** Valid response describing Audit Job progress. */
export const auditStatusResultSchema = z.strictObject({
  auditId: z.string().min(1),
  pageLimit: z.literal(25),
  pagesCrawled: z.number().int().min(0).max(25),
  status: auditJobStatusSchema,
});

/** Current Audit Job state. */
export type AuditStatusResult = z.infer<typeof auditStatusResultSchema>;

/** Valid score for one category in an audit summary. */
export const auditCategoryScoreSchema = z.strictObject({
  category: auditCategorySchema,
  issueCount: z.number().int().min(0),
  score: z.number().min(0).max(100),
});

/** Valid completed Quick Audit summary. */
export const auditSummaryResultSchema = z.strictObject({
  auditId: z.string().min(1),
  categories: z.array(auditCategoryScoreSchema),
  pagesAudited: z.number().int().min(0).max(25),
  score: z.number().min(0).max(100),
  url: z.url({ protocol: /^https?$/ }),
});

/** Completed Quick Audit overview. */
export type AuditSummaryResult = z.infer<typeof auditSummaryResultSchema>;

/** Valid severity for a category issue. */
export const auditIssueSeveritySchema = z.enum(["error", "warning", "notice"]);

/** Valid category issue returned by the crawler API. */
export const auditIssueSchema = z.strictObject({
  affectedUrl: z.url({ protocol: /^https?$/ }),
  code: z.string().min(1),
  description: z.string().min(1),
  severity: auditIssueSeveritySchema,
  title: z.string().min(1),
});

/** One normalized audit issue. */
export type AuditIssue = z.infer<typeof auditIssueSchema>;

/** Valid paginated category response. */
export const auditCategoryResultSchema = z.discriminatedUnion("hasMore", [
  z.strictObject({
    auditId: z.string().min(1),
    category: auditCategorySchema,
    hasMore: z.literal(true),
    items: z.array(auditIssueSchema).max(20),
    nextCursor: z.string().min(1),
  }),
  z.strictObject({
    auditId: z.string().min(1),
    category: auditCategorySchema,
    hasMore: z.literal(false),
    items: z.array(auditIssueSchema).max(20),
    nextCursor: z.string().min(1).optional(),
  }),
]);

/** One page of normalized category issues. */
export type AuditCategoryResult = z.infer<typeof auditCategoryResultSchema>;

/** Stable crawler failure codes understood by the MCP module. */
export type CrawlerErrorCode =
  | "not_found_or_expired"
  | "audit_not_ready"
  | "capacity_rejected"
  | "crawler_unavailable"
  | "invalid_crawler_response";

/** Options used to create a safe crawler boundary error. */
export interface CrawlerApiErrorOptions {
  /** Stable error code safe to expose through MCP. */
  code: CrawlerErrorCode;
  /** Original error retained for internal diagnosis. */
  cause?: unknown;
  /** Optional retry delay supplied by the crawler API. */
  retryAfterSeconds?: number;
  /** Upstream HTTP status when one was received. */
  status?: number;
}

/** Safe error emitted by the crawler API boundary. */
export class CrawlerApiError extends Error {
  /** Stable error code safe to expose through MCP. */
  readonly code: CrawlerErrorCode;

  /** Optional retry delay supplied by the crawler API. */
  readonly retryAfterSeconds: number | undefined;

  /** Upstream HTTP status when one was received. */
  readonly status: number | undefined;

  /**
   * Creates a crawler boundary error without leaking response details.
   */
  constructor(message: string, options: CrawlerApiErrorOptions) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "CrawlerApiError";
    this.code = options.code;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.status = options.status;
  }
}
