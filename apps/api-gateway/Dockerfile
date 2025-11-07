# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@8.15.6 --activate
RUN apk add --no-cache curl

WORKDIR /app

FROM base AS development

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./

# Copy all packages
COPY packages ./packages

# Copy api-gateway
COPY apps/api-gateway ./apps/api-gateway

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter @repo/types build
RUN pnpm --filter @repo/dto build
RUN pnpm --filter @repo/logger build
RUN pnpm --filter @repo/messaging build
RUN pnpm --filter @repo/decorators build
RUN pnpm --filter @repo/utils build

WORKDIR /app/apps/api-gateway

EXPOSE 3001

CMD ["pnpm", "start:dev"]
