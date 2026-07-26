# Production remote MCP stack recommendation

**Research date:** 2026-07-26  
**Scope:** TypeScript remote MCP adapter over an asynchronous crawler/audit API.

## Product scope correction

The open-source `crawler-mcp` application is a free, public, authless, stateless adapter targeting one final release. It does **not** own audit persistence, queues, billing, crawler workers, or user accounts.

For `crawler-mcp` itself:

- Use a portable Web Standard TypeScript core with a stateless Streamable HTTP endpoint; avoid roadmap-driven abstractions and migration scaffolding.
- Host the official free endpoint at `https://mcp.keytomic.com/` as one Node.js container deployed through Dokploy.
- Keep only the crawler API base URL and internal service credential as deployment secrets.
- Apply edge, global, and target-domain capacity limits; return `429` when capacity is exhausted.
- Keep every Audit Job and result in the separately operated crawler API.
- Deliberately pin the split MCP SDK packages to `2.0.0-beta.5` for this one final release.

The PostgreSQL, queue, object storage, worker, and OAuth sections below apply only if designing the separately operated crawler platform. They are not dependencies of the open-source MCP Adapter.

## Decision summary

Use a stateless Node.js service over Streamable HTTP. Keep crawl execution and durable job state behind the crawler API; the MCP layer should only authenticate, authorize, validate, translate, and shape compact results.

| Layer | Recommendation |
| --- | --- |
| Runtime | Node.js 24 LTS, TypeScript strict mode, ESM |
| MCP | Official TypeScript SDK; `@modelcontextprotocol/sdk` v1 today, controlled move to split v2 packages after GA and compatibility testing |
| HTTP | Express 5 with the official MCP adapter; one stateless `/mcp` Streamable HTTP endpoint |
| Auth | WorkOS AuthKit/Connect as OAuth authorization server; MCP service remains the resource server |
| Jobs | BullMQ on durable ElastiCache for Valkey 9; PostgreSQL audit row remains source of truth |
| Database | Amazon RDS PostgreSQL 18.4 Multi-AZ |
| Artifacts | Private Amazon S3, SSE-KMS, bucket key, versioning and retention lifecycle |
| Observability | OpenTelemetry traces/metrics over OTLP, Pino JSON logs, CloudWatch infrastructure alarms |
| Compute | Two ECS Fargate services: stateless MCP/API and isolated crawler workers |
| Edge | ALB + AWS WAF; coarse edge limits plus per-user/org/plan limits in Valkey |

Node recommends production applications use an LTS line; Node 24 is LTS while Node 26 is still Current on the research date ([Node release status](https://nodejs.org/en/about/previous-releases)).

## Critical version finding

The current released MCP specification is **2025-11-25**. A 2026-07-28 revision is planned but is not released as of this note.

The official TypeScript SDK says its `main` branch is v2 beta, targets the 2026-07-28 specification, and that **v1.x remains the production-supported line until v2 GA** ([official SDK README](https://github.com/modelcontextprotocol/typescript-sdk)). Registry state on 2026-07-26 is:

- `@modelcontextprotocol/sdk`: `1.29.0` stable.
- `@modelcontextprotocol/server` and `@modelcontextprotocol/node`: `2.0.0-beta.5`.

The general production recommendation is to remain on v1 until v2 GA. This project explicitly chooses the v2 beta instead, so it pins `@modelcontextprotocol/server`, `@modelcontextprotocol/node`, and `@modelcontextprotocol/hono` to exactly `2.0.0-beta.5`, never a floating tag or range. Inspector, ChatGPT, and Claude conformance tests are release gates.

The planned v2 split is useful: `@modelcontextprotocol/server` contains server primitives, `@modelcontextprotocol/node` the Node transport, and official Express/Hono packages stay thin adapters ([v2 package layout](https://github.com/modelcontextprotocol/typescript-sdk#packages)).

## Protocol and transport

Use **Streamable HTTP**, not legacy HTTP+SSE. It replaced HTTP+SSE and defines one endpoint supporting POST and optional GET/SSE behavior ([MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)). The official SDK calls Streamable HTTP the remote-server transport and supports stateless mode by omitting a session ID generator ([server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md)).

Recommended operating mode:

- `POST https://mcp.example.com/mcp`.
- Stateless transport; audit state lives in PostgreSQL, never an MCP process or session.
- JSON responses for ordinary calls; no long-lived connection is needed for an audit job.
- Horizontally scalable API tasks behind an ALB.
- No legacy SSE endpoint unless real client telemetry proves it is needed.
- Validate `Origin` and `Host`; return `403` for invalid origins. The transport specification explicitly requires Origin validation.

Express is the conservative Node choice because it has official MCP integration on both the production v1 path and planned v2 path. Hono is a sound alternative for Web Standard/Cloudflare deployments, but it adds no material benefit when the crawler and workers already require long-lived Node containers.

## Long-running audits: domain jobs, not MCP Tasks

Do **not** make MCP Tasks the primary audit contract. The released specification explicitly calls Tasks experimental and says their behavior may evolve ([MCP Tasks](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks)). The official SDK also exposes them under an experimental API. Client support is not broad enough for a production crawler contract.

Use stable goal-level tools:

- `start_website_audit` returns an `auditId` quickly.
- `get_audit_status` polls durable application state.
- `get_audit_summary` returns compact structured output.
- `get_audit_category` pages detailed findings.
- Add `cancel_audit` only when worker cancellation is implemented end-to-end.

This contract works even when a client supports only tool calls. Anthropic's API MCP connector currently supports only tools and requires a publicly reachable HTTP server ([Anthropic MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector)). MCP Tasks can later be an optional facade over the same audit records after capability detection and cross-client tests; they must not become the system of record.

Return `structuredContent` plus a terse text summary. Put large raw crawl snapshots and exports in object storage and return an authorized application URL or resource link. OpenAI recommends explicit schemas, accurate annotations, and tools shaped around recognizable user goals ([OpenAI MCP server guide](https://developers.openai.com/plugins/build/mcp-server)).

## Authentication and authorization

The MCP service is an OAuth **resource server**, not a home-grown authorization server. Use WorkOS AuthKit/Connect for a greenfield product because it supports Protected Resource Metadata, PKCE, Resource Indicators/audience binding, Client ID Metadata Documents (CIMD), and optional Dynamic Client Registration (DCR) compatibility ([WorkOS MCP guide](https://workos.com/docs/authkit/mcp)).

Required behavior comes from the MCP authorization specification:

- Serve RFC 9728 Protected Resource Metadata.
- Return `401` with `WWW-Authenticate: Bearer resource_metadata="..."`.
- Support OAuth 2.1 Authorization Code + S256 PKCE through the authorization server.
- Bind tokens to the canonical `/mcp` resource and validate issuer, audience, expiry, signature and scopes on every request.
- Use least-privilege scopes such as `audit:run`, `audit:read`, and `audit:cancel`.
- Never pass the MCP bearer token to the crawler API; use separate service credentials.
- Rotate refresh tokens for public clients and never log tokens.

These are protocol requirements, not vendor preferences ([MCP authorization specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization), [MCP security guidance](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)).

OpenAI supports CIMD, DCR, predefined clients and PKCE, and recommends an established identity provider rather than custom auth ([OpenAI authentication guide](https://developers.openai.com/plugins/build/auth)). Claude supports CIMD and DCR, always uses S256 PKCE, and prefers CIMD over DCR at directory scale because DCR can create many client registrations ([Claude authentication reference](https://claude.com/docs/connectors/building/authentication)).

**Alternatives:** use Auth0 or Stytch if already adopted. Stytch documents the full MCP flow including PRM, DCR, PKCE and token validation ([Stytch MCP auth](https://stytch.com/docs/connected-apps/guides/mcp-auth-overview)). Changing identity systems solely for MCP is usually worse than configuring an existing standards-compliant provider correctly.

## Durable jobs and data

### Queue

Use **BullMQ** with a managed, durable Valkey deployment. BullMQ supplies retries/backoff, stalled-job recovery, concurrency, deduplication and `AbortSignal` cancellation. Its production guidance requires durable storage, no key eviction, graceful worker shutdown, and warns that jobs are at-least-once, so processors must be idempotent ([production guidance](https://docs.bullmq.io/guide/going-to-production), [idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs), [cancellation](https://docs.bullmq.io/guide/workers/cancelling-jobs)).

Use ElastiCache Valkey 9 with synchronous durability for queue state; acknowledged writes are persisted across at least two AZs ([AWS durability announcement](https://aws.amazon.com/about-aws/whats-new/2026/06/durability-amazon-elasticache/)). BullMQ's current API documents a Valkey Glide adapter ([BullMQ API](https://api.docs.bullmq.io/)).

Rules:

- Queue payload contains only `auditId`, tenant ID and trace context; no raw pages, tokens or secrets.
- A unique audit/idempotency key prevents duplicate starts.
- PostgreSQL owns audit lifecycle and billing state; a reconciliation job re-enqueues orphaned `queued` audits.
- Workers checkpoint page/category progress and tolerate duplicate delivery.
- Separate queues/concurrency pools by audit class; enforce per-origin politeness independently.

**Alternatives:**

- Graphile Worker is simpler and transactionally shares PostgreSQL, with at-least-once execution and exponential retry ([official docs](https://worker.graphile.org/docs)). Prefer it for a smaller self-hosted edition or modest scale.
- Amazon SQS reduces queue operations but requires more application code for progress, cancellation, deduplication and orchestration.
- Temporal is justified only after workflows gain long multi-step compensation, cross-service coordination or human input. It is unnecessary for the initial start/poll/result audit lifecycle.

### Database and artifacts

Use RDS PostgreSQL 18.4 Multi-AZ, TLS, encryption at rest, automated backups/PITR and deletion protection. RDS supports PostgreSQL 18.4 and Multi-AZ deployments ([RDS versions](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-versions.html), [RDS PostgreSQL capabilities](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)).

Keep relational metadata, ownership, quotas, audit state, scores and normalized findings in PostgreSQL. Store page bodies, screenshots, full JSON exports and compressed crawl snapshots in private S3. Enable Block Public Access, SSE-KMS with a bucket key, versioning, and lifecycle expiry by plan/retention policy ([S3 public-access controls](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html), [SSE-KMS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html), [lifecycle rules](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)).

## Deployment, observability and limits

Deploy two independently scalable ECS Fargate services in private subnets:

1. `mcp-api`: minimum two tasks across AZs; stateless and latency-oriented.
2. `crawl-worker`: no inbound route; scales from queue depth and is CPU/memory constrained.

Fargate runs containers without managing hosts, and ECS target tracking can scale API services from CPU, memory or ALB request count ([Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html), [ECS scaling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/target-tracking-create-policy.html)). Prefer Fargate over Lambda: crawls and browser processes are long-lived, memory-heavy, and need predictable cancellation/graceful shutdown.

Instrument:

- OpenTelemetry auto-instrumentation for HTTP/Postgres plus manual spans for `mcp.tool`, enqueue, dequeue, crawl host, category analysis and S3 writes.
- OTLP through an OpenTelemetry Collector; Collector use is recommended for production ([OTel exporters](https://opentelemetry.io/docs/languages/js/exporters/)).
- Pino JSON application/audit logs; OTel JS traces and metrics are stable, while its logs SDK remains under development ([OTel JS status](https://opentelemetry.io/docs/languages/js/)).
- Propagate `traceId`, `auditId`, `tenantId`, tool name and job attempt. Never log target page bodies, auth headers or tokens by default.
- Alert on MCP p95/error rate, OAuth failures, queue age/depth, stalled/retried/dead jobs, audit duration/failure rate, worker saturation, per-host rejection, Postgres connections/storage and S3 errors.

Rate limiting needs three layers:

- AWS WAF coarse IP/bot/abuse control; rate-based rules count and limit matching aggregates ([AWS WAF rate rules](https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html)).
- Atomic Valkey token buckets keyed by user, organization and plan after authentication.
- Queue admission/concurrency limits by tenant and crawl target origin, with hard `maxPages`, depth, bytes, redirects and duration.

Return standard `429` plus `Retry-After`. Quotas must be enforced when accepting the audit, not only after expensive crawling begins.

## Security gates before public beta

- Application and network-level SSRF defenses: allow only HTTP(S), resolve and re-resolve DNS, reject loopback/private/link-local/multicast/metadata addresses, revalidate every redirect, restrict ports, cap redirects and response bytes.
- Run crawler workers in a dedicated account/VPC security boundary with least-privilege task roles and no access to control-plane/private application networks.
- Enforce robots.txt by default; never expose a public bypass flag.
- Treat crawled text as untrusted data, not instructions. Do not let page content modify tool policy, auth, requested scope or destination.
- Tenant-scope every query and object key; use opaque, high-entropy IDs.
- Accurate MCP annotations: status/summary/category tools are read-only; start is non-read-only and open-world; cancellation changes state.
- Dependency pinning, lockfile review, container image scanning, non-root read-only containers, secrets from Secrets Manager, TLS everywhere.
- Cross-client conformance tests with MCP Inspector, ChatGPT and Claude for initialization, auth discovery/refresh, invalid Origin, disconnect/retry, `429`, duplicate start and oversized results.

## Recommended delivery sequence

1. Define stable audit job API and ownership/state invariants.
2. Complete SSRF/network isolation and OAuth resource-server behavior.
3. Build idempotent queue/worker orchestration and compact stored outputs.
4. Add the four stable MCP tools over stateless Streamable HTTP.
5. Add quotas, observability, recovery drills and load tests.
6. Validate against Inspector, ChatGPT and Claude.
7. Reassess MCP v2 stable and Tasks separately; neither should block the core launch.
