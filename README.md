# Keytomic MCP

Free, public remote MCP access to Keytomic Quick Audits.

This repository is the stateless MCP adapter. The crawler API remains a private,
separate service and owns audit jobs and results.

## Development

Requires Node.js 24 and pnpm.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

MCP is served at `http://localhost:3000/`; health is available at
`http://localhost:3000/health`.

See [repository design](docs/repository-design.md) for the authoritative scope
and architecture.
