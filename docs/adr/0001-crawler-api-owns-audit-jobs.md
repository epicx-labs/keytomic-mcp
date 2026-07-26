# ADR 0001: Crawler API owns audit jobs

Status: accepted

## Decision

Keytomic MCP starts and reads Audit Jobs through the crawler API. The crawler
API owns execution, durable state, results, expiry, quotas, and recovery.

## Consequences

The MCP adapter remains stateless and needs no database, queue, cache, or worker.
The crawler API must provide asynchronous audit endpoints before the public MCP
can be fully operational.
