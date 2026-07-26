import type {
  AuditCategory,
  AuditCategoryResult,
  AuditStatusResult,
  AuditSummaryResult,
  StartAuditResult,
} from "./contracts.js";

/** Crawler capabilities required by the public MCP module. */
export interface CrawlerPort {
  /**
   * Starts the fixed Quick Audit for one public HTTP or HTTPS URL.
   */
  startWebsiteAudit(url: string): Promise<StartAuditResult>;

  /**
   * Reads the current lifecycle state of an Audit Job.
   */
  getAuditStatus(auditId: string): Promise<AuditStatusResult>;

  /**
   * Reads the completed overview of an Audit Job.
   */
  getAuditSummary(auditId: string): Promise<AuditSummaryResult>;

  /**
   * Reads one fixed-size page of issues for an audit category.
   */
  getAuditCategory(
    auditId: string,
    category: AuditCategory,
    cursor?: string,
  ): Promise<AuditCategoryResult>;
}
