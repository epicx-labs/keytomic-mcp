# ADR 0002: Deploy one container through Dokploy

Status: accepted

## Decision

Build one stateless Node.js container from the root `Dockerfile`. Dokploy routes
`mcp.keytomic.com` to it; Route53 remains authoritative for DNS.

## Consequences

Deployment has one artifact and one runtime. Cloudflare Workers, Compose,
Nixpacks, Buildpacks, and infrastructure-as-code are unnecessary here.
