import {
  createMcpHandler,
  type McpHttpHandler,
  McpServer,
} from "@modelcontextprotocol/server";
import type { z } from "zod";
import { CrawlerApiError } from "../crawler/contracts.js";
import type { CrawlerPort } from "../crawler/port.js";
import {
  auditCategoryInputSchema,
  auditCategoryOutputSchema,
  auditIdInputSchema,
  auditStatusOutputSchema,
  auditSummaryOutputSchema,
  type FailedToolOutput,
  startWebsiteAuditInputSchema,
  startWebsiteAuditOutputSchema,
} from "./contracts.js";

type StartWebsiteAuditInput = z.infer<typeof startWebsiteAuditInputSchema>;
type AuditIdInput = z.infer<typeof auditIdInputSchema>;
type AuditCategoryInput = z.infer<typeof auditCategoryInputSchema>;

/**
 * Serializes a tool result into the MCP text-content compatibility surface.
 */
function textContent(value: object): {
  text: string;
  type: "text";
}[] {
  return [{ text: JSON.stringify(value), type: "text" }];
}

/**
 * Maps an unknown failure to a small public error vocabulary.
 */
function toFailedToolOutput(error: unknown): FailedToolOutput {
  if (error instanceof CrawlerApiError) {
    const retryAfter =
      error.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: error.retryAfterSeconds };

    return {
      error: {
        code: error.code,
        message: error.message,
        ...retryAfter,
      },
      ok: false,
    };
  }

  return {
    error: {
      code: "internal_error",
      message: "The audit request could not be completed.",
    },
    ok: false,
  };
}

/**
 * Converts one crawler operation into a structured MCP tool result.
 */
async function executeTool<Data extends object>(operation: Promise<Data>) {
  try {
    const output: { data: Data; ok: true } = {
      data: await operation,
      ok: true,
    };
    return {
      content: textContent(output),
      structuredContent: output,
    };
  } catch (error) {
    const output = toFailedToolOutput(error);
    return {
      content: textContent(output),
      isError: true,
      structuredContent: output,
    };
  }
}

/**
 * Creates one MCP server with the complete Keytomic Quick Audit tool surface.
 */
export function createKeytomicMcpServer(crawler: CrawlerPort): McpServer {
  const server = new McpServer({
    name: "keytomic-mcp",
    version: "1.0.0",
  });

  /**
   * Starts one fixed Quick Audit.
   */
  async function handleStartWebsiteAudit({ url }: StartWebsiteAuditInput) {
    return executeTool(crawler.startWebsiteAudit(url));
  }

  /**
   * Reads one Audit Job's current state.
   */
  async function handleGetAuditStatus({ auditId }: AuditIdInput) {
    return executeTool(crawler.getAuditStatus(auditId));
  }

  /**
   * Reads one completed Audit Job summary.
   */
  async function handleGetAuditSummary({ auditId }: AuditIdInput) {
    return executeTool(crawler.getAuditSummary(auditId));
  }

  /**
   * Reads one fixed-size category issue page.
   */
  async function handleGetAuditCategory({
    auditId,
    category,
    cursor,
  }: AuditCategoryInput) {
    return executeTool(crawler.getAuditCategory(auditId, category, cursor));
  }

  server.registerTool(
    "start_website_audit",
    {
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      description:
        "Start a free Quick Audit of up to 25 pages for one website URL.",
      inputSchema: startWebsiteAuditInputSchema,
      outputSchema: startWebsiteAuditOutputSchema,
      title: "Start website audit",
    },
    handleStartWebsiteAudit,
  );

  server.registerTool(
    "get_audit_status",
    {
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      description: "Read the current state and progress of an Audit Job.",
      inputSchema: auditIdInputSchema,
      outputSchema: auditStatusOutputSchema,
      title: "Get audit status",
    },
    handleGetAuditStatus,
  );

  server.registerTool(
    "get_audit_summary",
    {
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      description: "Read the completed summary of an Audit Job.",
      inputSchema: auditIdInputSchema,
      outputSchema: auditSummaryOutputSchema,
      title: "Get audit summary",
    },
    handleGetAuditSummary,
  );

  server.registerTool(
    "get_audit_category",
    {
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      description:
        "Read 20 crawlability, indexability, or metadata issues at a time.",
      inputSchema: auditCategoryInputSchema,
      outputSchema: auditCategoryOutputSchema,
      title: "Get audit category",
    },
    handleGetAuditCategory,
  );

  return server;
}

/**
 * Creates a stateless HTTP handler supporting current and legacy MCP clients.
 */
export function createKeytomicMcpHandler(crawler: CrawlerPort): McpHttpHandler {
  /**
   * Creates an isolated server for one stateless request.
   */
  function createServer(): McpServer {
    return createKeytomicMcpServer(crawler);
  }

  return createMcpHandler(createServer, {
    legacy: "stateless",
  });
}
