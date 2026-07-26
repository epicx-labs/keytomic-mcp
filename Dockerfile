FROM node:24.13.0-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build && pnpm prune --prod

FROM node:24.13.0-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

RUN addgroup --system --gid 1001 keytomic \
  && adduser --system --uid 1001 --ingroup keytomic keytomic

COPY --from=build --chown=keytomic:keytomic /app/dist ./dist
COPY --from=build --chown=keytomic:keytomic /app/node_modules ./node_modules
COPY --from=build --chown=keytomic:keytomic /app/package.json ./package.json

USER keytomic

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/server.js"]
