import type { McpHttpHandler } from "@modelcontextprotocol/server";
import { expect, test } from "vitest";
import { z } from "zod";
import type {
  AuditCategory,
  AuditCategoryResult,
  AuditStatusResult,
  AuditSummaryResult,
  StartAuditResult,
} from "../src/crawler/contracts.js";
import type { CrawlerPort } from "../src/crawler/port.js";
import { createKeytomicMcpHandler } from "../src/mcp/module.js";

const toolListResponseSchema = z.object({
  id: z.number(),
  jsonrpc: z.literal("2.0"),
  result: z.object({
    tools: z.array(z.object({ name: z.string() })),
  }),
});

const callToolResponseSchema = z.object({
  id: z.number(),
  jsonrpc: z.literal("2.0"),
  result: z.object({
    isError: z.boolean().optional(),
    structuredContent: z.object({
      data: z.object({
        auditId: z.string(),
        status: z.string(),
      }),
      ok: z.literal(true),
    }),
  }),
});

/**
 * Deterministic crawler behavior for the MCP public seam.
 */
class StubCrawler implements CrawlerPort {
  /** Returns one category page. */
  async getAuditCategory(
    auditId: string,
    category: AuditCategory,
    _cursor?: string,
  ): Promise<AuditCategoryResult> {
    return {
      auditId,
      category,
      hasMore: false,
      items: [],
    };
  }

  /** Returns a completed status. */
  async getAuditStatus(auditId: string): Promise<AuditStatusResult> {
    return {
      auditId,
      pageLimit: 25,
      pagesCrawled: 25,
      status: "completed",
    };
  }

  /** Returns a minimal completed summary. */
  async getAuditSummary(auditId: string): Promise<AuditSummaryResult> {
    return {
      auditId,
      categories: [],
      pagesAudited: 25,
      score: 100,
      url: "https://example.com",
    };
  }

  /** Starts a queued audit. */
  async startWebsiteAudit(_url: string): Promise<StartAuditResult> {
    return {
      auditId: "audit-123",
      status: "queued",
    };
  }
}

/**
 * Sends one legacy stateless JSON-RPC request to the MCP handler.
 */
async function postJson(
  handler: McpHttpHandler,
  body: object,
): Promise<unknown> {
  const response = await handler.fetch(
    new Request("https://mcp.keytomic.com/", {
      body: JSON.stringify(body),
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      method: "POST",
    }),
  );

  expect(response.status).toBe(200);
  if (response.headers.get("content-type")?.includes("application/json")) {
    return response.json();
  }

  const responseText = await response.text();
  for (const line of responseText.split("\n")) {
    if (line.startsWith("data: ")) {
      return JSON.parse(line.slice(6));
    }
  }

  throw new Error("Expected a JSON or SSE JSON-RPC response.");
}

/**
 * Verifies the entire advertised tool surface.
 */
async function listsOnlyTheFourTools(): Promise<void> {
  const handler = createKeytomicMcpHandler(new StubCrawler());

  try {
    const body = await postJson(handler, {
      id: 1,
      jsonrpc: "2.0",
      method: "tools/list",
      params: {},
    });
    const response = toolListResponseSchema.parse(body);

    expect(response.result.tools.map((tool) => tool.name)).toEqual([
      "start_website_audit",
      "get_audit_status",
      "get_audit_summary",
      "get_audit_category",
    ]);
  } finally {
    await handler.close();
  }
}

/**
 * Verifies tool calls return structured data from the crawler port.
 */
async function startsAnAuditThroughMcp(): Promise<void> {
  const handler = createKeytomicMcpHandler(new StubCrawler());

  try {
    const body = await postJson(handler, {
      id: 2,
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        arguments: {
          url: "https://example.com",
        },
        name: "start_website_audit",
      },
    });
    const response = callToolResponseSchema.parse(body);

    expect(response.result.structuredContent).toEqual({
      data: {
        auditId: "audit-123",
        status: "queued",
      },
      ok: true,
    });
  } finally {
    await handler.close();
  }
}

test("lists exactly the four Quick Audit tools", listsOnlyTheFourTools);
test("starts an audit through MCP JSON-RPC", startsAnAuditThroughMcp);
