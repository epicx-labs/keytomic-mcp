import { expect, test } from "vitest";
import { createCrawlerHttpAdapter } from "../src/crawler/http-adapter.js";

/**
 * Verifies that the adapter applies the fixed Quick Audit contract.
 */
async function startsAQuickAudit(): Promise<void> {
  let capturedRequest: Request | undefined;

  /**
   * Captures the outbound crawler request and returns a valid response.
   */
  async function fakeFetch(
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    capturedRequest = new Request(input, init);
    return Response.json({
      auditId: "audit-123",
      status: "queued",
    });
  }

  const crawler = createCrawlerHttpAdapter({
    baseUrl: "https://crawler.internal",
    fetch: fakeFetch,
    timeoutMs: 1_000,
    token: "internal-secret",
  });

  await expect(
    crawler.startWebsiteAudit("https://example.com"),
  ).resolves.toEqual({
    auditId: "audit-123",
    status: "queued",
  });

  if (capturedRequest === undefined) {
    throw new Error("Expected an outbound crawler request.");
  }

  expect(capturedRequest.method).toBe("POST");
  expect(capturedRequest.url).toBe("https://crawler.internal/v2/audits");
  expect(capturedRequest.headers.get("authorization")).toBe(
    "Bearer internal-secret",
  );
  await expect(capturedRequest.json()).resolves.toEqual({
    categories: ["crawlability", "indexability", "metadata"],
    maxPages: 25,
    url: "https://example.com",
  });
}

test("starts a fixed Quick Audit through the crawler API", startsAQuickAudit);
