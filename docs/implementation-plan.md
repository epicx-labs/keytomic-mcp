# Implementation Plan

## Outcome

A production-shaped, stateless Keytomic MCP container serving MCP at `/` and
health at `/health`.

## Vertical slices

1. Scaffold strict TypeScript, Biome, Vitest, package scripts, and CI.
2. Add validated configuration and the HTTP composition root.
3. Add the crawler port, contracts, and HTTP adapter.
4. Mount a stateless MCP handler and register the four tools.
5. Map validation, missing/expired, not-ready, capacity, and upstream failures.
6. Add the production Docker image and runtime health check.
7. Verify formatting, types, tests, build, and Docker build.

## Test seams

- MCP JSON-RPC through the Hono handler.
- Crawler HTTP through injected `fetch`.
- Built server through real HTTP.

## Completion criteria

- Four tools match `repository-design.md`.
- The root MCP endpoint is authless.
- The internal crawler token never reaches clients or logs.
- No local persistence or job ownership exists.
- Invalid crawler data fails closed.
- `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
- The Docker image builds and responds on `/health`.
