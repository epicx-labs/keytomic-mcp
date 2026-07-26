# Keytomic MCP Context

Keytomic MCP is the public, stateless MCP adapter over the separately operated
Keytomic crawler API.

## Language

- **MCP Adapter**: this repository. It translates MCP calls into crawler API
  requests. It is not a crawler, database, or job runner.
- **Crawler API**: the private service that owns audit execution, durable state,
  results, quotas, and recovery.
- **Audit Job**: an asynchronous crawler API operation identified by an opaque
  `auditId`. Jobs expire after 24 hours.
- **Quick Audit**: the only supported audit: at most 25 pages across
  crawlability, indexability, and metadata.
- **Capacity Rejection**: a temporary `429` caused by global, network, or domain
  capacity limits. It is not an authentication or entitlement error.

## Invariants

- The MCP Adapter has no login, user state, job state, database, queue, or cache.
- The Crawler API is the system of record.
- `start_website_audit` accepts only a URL.
- Quick Audit limits and categories are fixed.
- Category pagination uses an opaque cursor and a fixed page size of 20.
- Unknown and expired jobs both return `not_found_or_expired`.
- The service may return Capacity Rejection.
- This repository targets one final production release, not speculative future
  versions.
