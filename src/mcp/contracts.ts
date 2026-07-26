import { z } from "zod";
import {
  auditCategoryResultSchema,
  auditCategorySchema,
  auditStatusResultSchema,
  auditSummaryResultSchema,
  startAuditResultSchema,
} from "../crawler/contracts.js";

/** Public input accepted by `start_website_audit`. */
export const startWebsiteAuditInputSchema = z.strictObject({
  url: z.url({ protocol: /^https?$/ }),
});

/** Public input accepted by status and summary tools. */
export const auditIdInputSchema = z.strictObject({
  auditId: z.string().min(1),
});

/** Public input accepted by `get_audit_category`. */
export const auditCategoryInputSchema = z.strictObject({
  auditId: z.string().min(1),
  category: auditCategorySchema,
  cursor: z.string().min(1).optional(),
});

/** Stable public error payload returned by tools. */
export const toolErrorSchema = z.strictObject({
  code: z.enum([
    "not_found_or_expired",
    "audit_not_ready",
    "capacity_rejected",
    "crawler_unavailable",
    "invalid_crawler_response",
    "internal_error",
  ]),
  message: z.string().min(1),
  retryAfterSeconds: z.number().int().min(0).optional(),
});

/** Failed public tool result. */
export const failedToolOutputSchema = z.strictObject({
  error: toolErrorSchema,
  ok: z.literal(false),
});

/**
 * Creates a success/error envelope schema for one crawler result.
 */
function createToolOutputSchema<DataSchema extends z.ZodType>(
  dataSchema: DataSchema,
) {
  return z.discriminatedUnion("ok", [
    z.strictObject({
      data: dataSchema,
      ok: z.literal(true),
    }),
    failedToolOutputSchema,
  ]);
}

/** Output contract for `start_website_audit`. */
export const startWebsiteAuditOutputSchema = createToolOutputSchema(
  startAuditResultSchema,
);

/** Output contract for `get_audit_status`. */
export const auditStatusOutputSchema = createToolOutputSchema(
  auditStatusResultSchema,
);

/** Output contract for `get_audit_summary`. */
export const auditSummaryOutputSchema = createToolOutputSchema(
  auditSummaryResultSchema,
);

/** Output contract for `get_audit_category`. */
export const auditCategoryOutputSchema = createToolOutputSchema(
  auditCategoryResultSchema,
);

/** Stable failed tool output. */
export type FailedToolOutput = z.infer<typeof failedToolOutputSchema>;
