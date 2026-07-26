# Keytomic MCP Repository Design

Status: accepted  
Repository: `keytomic-mcp`  
License: MIT

## Purpose

Keytomic MCP is a free, public, authless remote MCP adapter for the private
Keytomic crawler API. It exposes a bounded Quick Audit to MCP clients without
duplicating crawler execution or persistence.

The public MCP endpoint is `https://mcp.keytomic.com/`. The operational health
endpoint is `https://mcp.keytomic.com/health`.

## Fixed product contract

The server exposes four tools:

| Tool | Input | Purpose |
| --- | --- | --- |
| `start_website_audit` | `url` | Start a fixed 25-page Quick Audit |
| `get_audit_status` | `auditId` | Read asynchronous job state |
| `get_audit_summary` | `auditId` | Read the completed audit overview |
| `get_audit_category` | `auditId`, `category`, optional `cursor` | Read 20 category issues at a time |

Quick Audit categories are `crawlability`, `indexability`, and `metadata`.
Unknown and expired audit IDs share the stable error
`not_found_or_expired`. An upstream `429` becomes the MCP tool error
`capacity_rejected`; the outer response remains valid MCP JSON-RPC.

The adapter has no accounts, API keys for callers, persistence, queue, cache,
MCP resources, MCP prompts, cancellation API, or stdio transport.

## Stack

- Node.js 24
- TypeScript, strict ESM
- pnpm
- MCP SDK v2 beta, pinned exactly
- Hono with its Node adapter
- Zod at external boundaries
- Vitest
- Biome
- Docker multi-stage build
- GitHub Actions CI
- Dokploy deployment

The MCP SDK remains pinned because beta APIs may change without a stable
semantic-version signal. Other dependencies use a lockfile and automated,
reviewed upgrades.

## Repository shape

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── adr/
│   │   ├── 0001-crawler-api-owns-audit-jobs.md
│   │   ├── 0002-deploy-one-container-through-dokploy.md
│   │   └── 0003-pin-mcp-sdk-v2-beta.md
│   ├── implementation-plan.md
│   └── repository-design.md
├── src/
│   ├── crawler/
│   │   ├── contracts.ts
│   │   ├── http-adapter.ts
│   │   └── port.ts
│   ├── mcp/
│   │   ├── contracts.ts
│   │   └── module.ts
│   ├── config.ts
│   └── server.ts
├── tests/
│   ├── crawler-http-adapter.test.ts
│   ├── mcp.test.ts
│   └── server.test.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── biome.json
├── CONTEXT.md
├── Dockerfile
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── README.md
├── SECURITY.md
├── tsconfig.build.json
├── tsconfig.json
└── vitest.config.ts
```

This is intentionally one package. A monorepo would add release, dependency,
and tooling overhead without a second independently versioned product.

## Module boundaries

```text
server.ts ──> mcp/module.ts ──> crawler/port.ts <── crawler/http-adapter.ts
    │                                                    │
    └──────────────── config.ts ─────────────────────────┘
```

### `src/server.ts`

The composition root. It loads configuration, creates the crawler HTTP adapter,
mounts the MCP handler at `/`, exposes `/health`, and starts Node. It contains no
audit behavior.

### `src/mcp/module.ts`

The MCP-facing deep module. It registers all four tools, validates tool inputs,
calls the crawler port, returns structured and text content, and maps stable
errors. Keeping the four related handlers together makes the complete public
surface reviewable in one place.

### `src/crawler/port.ts`

The internal capability required by MCP. It contains four operations matching
the product language, not HTTP concepts.

### `src/crawler/http-adapter.ts`

The only module aware of crawler URLs, bearer credentials, request timeouts,
HTTP status codes, and crawler response validation. It is an anti-corruption
boundary between the private API and the public MCP contract.

### Contract files

`crawler/contracts.ts` describes validated crawler-domain values.
`mcp/contracts.ts` describes public tool inputs. Contracts stay beside their
own boundary; there is no global `types`, `utils`, or `services` directory.

## Dependency rules

- MCP code depends on the crawler port, never the HTTP adapter.
- The HTTP adapter implements the crawler port and cannot import MCP code.
- Only the composition root selects concrete adapters.
- Boundary data is parsed with Zod before use.
- No barrel exports, framework wrappers, generated client, or speculative
  extension points.
- Every exported function, interface, and property has JSDoc.

## Runtime flow

1. An MCP client sends Streamable HTTP JSON-RPC to `/`.
2. The MCP module validates the tool input.
3. The tool calls the crawler port.
4. The HTTP adapter authenticates to the private crawler API with the internal
   service token.
5. The adapter validates the response and returns a domain result.
6. The MCP module returns `structuredContent` plus a short text representation.

The adapter never stores the `auditId` or result.

## Crawler API dependency

The private crawler API owns these endpoints:

```text
POST /v2/audits
GET  /v2/audits/:auditId
GET  /v2/audits/:auditId/summary
GET  /v2/audits/:auditId/categories/:category
```

`POST /v2/audits` receives the URL plus server-owned Quick Audit settings.
Category requests pass an optional opaque cursor and always request 20 items.

## Configuration

| Variable | Required | Meaning |
| --- | --- | --- |
| `CRAWLER_API_BASE_URL` | yes | Private crawler API origin |
| `CRAWLER_API_TOKEN` | yes | Internal bearer token |
| `PORT` | no | HTTP port, default `3000` |

Configuration is parsed once at startup. Secrets are never accepted from MCP
callers, logged, or committed.

## Error contract

The public module uses a small stable vocabulary:

- `not_found_or_expired`
- `audit_not_ready`
- `capacity_rejected`
- `crawler_unavailable`
- `invalid_crawler_response`
- `internal_error`

Crawler details and credentials are not exposed. Retryable errors include a
concise retry hint where available. Invalid tool input is rejected by the MCP
SDK as JSON-RPC invalid params before a tool handler runs.

## Testing strategy

Tests exercise three public seams:

1. MCP JSON-RPC handler with an in-memory crawler port.
2. Crawler HTTP adapter with a fake `fetch`.
3. Built Node process through HTTP.

Tests assert observable behavior, not private helpers. The remote boundary is
the only mocked dependency. Each behavior is introduced red-first.

## CI

Pull requests and pushes to `main` run:

1. frozen pnpm install
2. Biome check
3. TypeScript typecheck
4. Vitest
5. production build
6. Docker image build

CI does not deploy.

## Deployment

Dokploy builds the root `Dockerfile` and runs one stateless container. Its
Traefik integration routes `mcp.keytomic.com` to container port `3000`.
Route53 remains authoritative and points the hostname at the Dokploy server.

There is no Cloudflare runtime, Compose file, Nixpacks, Buildpacks, CDK,
Terraform, or deployment workflow in this repository.

## Deliberate omissions

- No RDS/Postgres: the crawler API already owns durable job state.
- No local queue/cache: the adapter is stateless.
- No monorepo: the private crawler remains separate.
- No caller authentication or accounts: this MCP is free and public.
- No Chrome extension: explicitly outside this repository.
- No npm package publication: this is a deployed application.
- No future-version scaffolding: build the single intended release cleanly.

Implementation order and completion checks are in
[implementation-plan.md](implementation-plan.md).
