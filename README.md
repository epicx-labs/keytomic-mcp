# Keytomic MCP

[![CI](https://github.com/epicx-labs/keytomic-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/epicx-labs/keytomic-mcp/actions/workflows/ci.yml)

Keytomic MCP gives AI clients free, public remote access to bounded website
Quick Audits. It translates MCP tool calls into requests to Keytomic's private
crawler API without owning crawl execution or storing audit data.

The production MCP endpoint is planned for:

```text
https://mcp.keytomic.com/
```

The operational health endpoint is:

```text
https://mcp.keytomic.com/health
```

## What this server does

The server exposes one focused workflow:

1. An MCP client starts a Quick Audit for a public HTTP or HTTPS URL.
2. The crawler API asynchronously audits up to 25 pages.
3. The client polls the Audit Job using its opaque `auditId`.
4. When complete, the client reads the summary and paginated category issues.

Every Quick Audit covers three fixed categories:

- `crawlability`
- `indexability`
- `metadata`

The MCP Adapter is intentionally small and stateless. The separate Crawler API
owns job execution, durable state, results, quotas, expiry, and recovery.

## MCP tools

| Tool | Input | Result |
| --- | --- | --- |
| `start_website_audit` | `url` | Starts a fixed 25-page Quick Audit and returns an `auditId` |
| `get_audit_status` | `auditId` | Returns lifecycle state and crawl progress |
| `get_audit_summary` | `auditId` | Returns the completed score and category totals |
| `get_audit_category` | `auditId`, `category`, optional `cursor` | Returns up to 20 issues and an optional next cursor |

### Typical tool sequence

```text
start_website_audit
        |
        v
 get_audit_status ----> queued / running
        |
        v
     completed
        |
        +------> get_audit_summary
        |
        +------> get_audit_category
                    |
                    +------> repeat with nextCursor
```

Audit Jobs expire after 24 hours. Clients should treat `auditId` and pagination
cursors as opaque values.

## Scope

### Included

- Remote MCP over Streamable HTTP at `/`
- Compatibility with legacy stateless MCP clients
- Structured and text tool results
- Strict validation at MCP and crawler boundaries
- Stable, client-safe error codes
- Internal bearer authentication to the Crawler API
- Health endpoint at `/health`
- Production multi-stage Docker image
- CI checks for formatting, types, tests, build, and Docker
- Stateless horizontal scaling

### Deliberately excluded

- Website crawling inside this repository
- Local job ownership, persistence, queues, or caches
- Caller accounts, API keys, or login
- Configurable page limits or audit categories
- MCP resources, prompts, cancellation, or stdio transport
- Billing, subscriptions, or usage entitlements
- Browser extensions or npm package publication

These boundaries keep the public adapter independently deployable while the
Crawler API remains the system of record.

## Architecture

```text
MCP client
    |
    | Streamable HTTP JSON-RPC
    v
Keytomic MCP Adapter
    |
    | private HTTP + internal bearer token
    v
Keytomic Crawler API
    |
    +---- execution
    +---- job state
    +---- results
    +---- quotas and recovery
```

The code follows four direct module boundaries:

```text
server.ts ──> mcp/module.ts ──> crawler/port.ts <── crawler/http-adapter.ts
    │                                                    │
    └──────────────── config.ts ─────────────────────────┘
```

- `src/server.ts` composes dependencies and mounts `/` and `/health`.
- `src/mcp/module.ts` owns the four public tools and error mapping.
- `src/crawler/port.ts` defines the crawler capabilities needed by MCP.
- `src/crawler/http-adapter.ts` owns private HTTP details and response
  validation.
- Contract files keep Zod schemas beside their respective boundaries.

See [Repository Design](docs/repository-design.md) for the authoritative
architecture and trade-offs.

## Error contract

Tool failures remain valid MCP responses and use a small public vocabulary:

| Code | Meaning |
| --- | --- |
| `not_found_or_expired` | The Audit Job is unknown or has expired |
| `audit_not_ready` | Results were requested before the job completed |
| `capacity_rejected` | Temporary crawler capacity is exhausted |
| `crawler_unavailable` | The private crawler could not complete the request |
| `invalid_crawler_response` | Crawler output failed strict validation |
| `internal_error` | An unexpected adapter failure occurred |

When the Crawler API supplies a safe numeric retry delay, the error includes
`retryAfterSeconds`. Private response bodies, internal credentials, and
implementation details are never returned to MCP clients.

## Security model

The public MCP endpoint is authless. Its risk is bounded by the fixed 25-page
Quick Audit contract and capacity controls owned by the Crawler API.

- The internal crawler token comes only from runtime configuration.
- The token is never accepted from clients, returned in results, or logged.
- Crawler responses fail closed when their schemas do not match.
- Unknown and expired jobs share one error to avoid disclosing job existence.
- The runtime uses an unprivileged container user.
- No caller or audit data is persisted by this service.

Report vulnerabilities using the process in [SECURITY.md](SECURITY.md).

## Requirements

- Node.js 24
- pnpm 10
- Access to a compatible Keytomic Crawler API

## Local development

Install dependencies and create local configuration:

```bash
pnpm install
cp .env.example .env
```

Set the required values:

```dotenv
CRAWLER_API_BASE_URL=https://crawler-api.example.com
CRAWLER_API_TOKEN=replace-me
PORT=3000
```

Start the development server:

```bash
pnpm dev
```

Local endpoints:

- MCP: `http://localhost:3000/`
- Health: `http://localhost:3000/health`

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the TypeScript server in watch mode |
| `pnpm check` | Check formatting and lint rules with Biome |
| `pnpm typecheck` | Type-check without emitting files |
| `pnpm test` | Build and run the Vitest suite |
| `pnpm build` | Compile production JavaScript into `dist/` |
| `pnpm start` | Run the compiled production server |

Run the complete local quality gate:

```bash
pnpm check
pnpm typecheck
pnpm test
pnpm build
docker build --tag keytomic-mcp .
```

## Docker

Build and run the production image:

```bash
docker build --tag keytomic-mcp .
docker run --rm \
  --publish 3000:3000 \
  --env CRAWLER_API_BASE_URL=https://crawler-api.example.com \
  --env CRAWLER_API_TOKEN=replace-me \
  keytomic-mcp
```

The image uses Node.js 24 Alpine, contains production dependencies only, runs as
an unprivileged user, and checks `/health` for container health.

## Testing

The test suite exercises observable behavior at three seams:

1. MCP JSON-RPC through the in-memory Hono handler.
2. Crawler HTTP through an injected `fetch`.
3. The compiled Node server through real loopback HTTP.

Remote crawler behavior is the only mocked boundary. Private helpers are tested
through public outcomes.

## Deployment

The intended production topology is one stateless container deployed through
Dokploy:

1. Dokploy builds the root `Dockerfile`.
2. Runtime configuration supplies the crawler URL and token.
3. Traefik routes `mcp.keytomic.com` to container port `3000`.
4. Route53 points the public hostname to the Dokploy server.
5. Dokploy monitors `/health`.

CI validates pushes and pull requests but does not deploy.

## Product roadmap

The current four-tool Quick Audit is the stable product core. Future work is
prioritized by user value and operational evidence; roadmap items are direction,
not a compatibility promise.

### 1. Production launch and reliability

- Deploy and verify `mcp.keytomic.com`.
- Add end-to-end smoke checks against the production MCP and Crawler API.
- Define availability, latency, capacity, and error-rate service indicators.
- Document incident response, token rotation, rollback, and recovery.

Exit criterion: the public endpoint is observable, supportable, and safe to
operate continuously.

### 2. MCP client experience

- Publish setup examples for major remote MCP clients.
- Add copy-paste tool workflows and troubleshooting guidance.
- Validate structured outputs and legacy compatibility across supported clients.
- Gather failure and completion feedback without storing audit content.

Exit criterion: a new user can connect, run an audit, and understand the result
without operator help.

### 3. Audit usefulness

- Use real Quick Audit feedback to identify missing explanations or result
  context.
- Improve issue titles, descriptions, and remediation guidance at the Crawler
  API boundary.
- Evaluate additional bounded categories only when the Crawler API owns their
  contracts and execution.
- Preserve predictable limits and explicit pagination as result depth grows.

Exit criterion: expansions solve demonstrated user problems and retain a small,
stable MCP surface.

### 4. Sustainable public access

- Measure aggregate capacity pressure and abuse patterns outside audit content.
- Tune domain and global capacity limits in the Crawler API.
- Evaluate fair-use controls only if authless access becomes operationally
  unsafe.
- Keep client-facing capacity errors actionable and retryable.

Exit criterion: free access remains reliable without moving crawler ownership or
durable user state into this adapter.

### 5. Protocol and platform maturity

- Review the pinned MCP SDK when its required APIs become stable.
- Add protocol capabilities only when they materially improve the audit
  workflow.
- Keep dependency upgrades reviewed, reproducible, and covered by compatibility
  tests.
- Revisit deployment topology only when production evidence exceeds the limits
  of one stateless container.

Exit criterion: platform changes reduce operational risk or improve the user
workflow without speculative architecture.

### Roadmap decision rules

Every proposed capability must answer:

1. What observed user or operational problem does it solve?
2. Does it belong in the MCP Adapter or the Crawler API?
3. Can the adapter remain stateless?
4. Does it preserve a bounded, understandable public contract?
5. How will compatibility, security, and operations be verified?

Hard-to-reverse changes require an ADR before implementation.

## Project documentation

- [Domain language and invariants](CONTEXT.md)
- [Repository design](docs/repository-design.md)
- [Implementation plan](docs/implementation-plan.md)
- [Architecture decisions](docs/adr/)
- [Security policy](SECURITY.md)
- [License](LICENSE)
