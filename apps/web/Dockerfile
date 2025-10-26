# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

FROM base AS development

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages

COPY packages ./packages
COPY apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
