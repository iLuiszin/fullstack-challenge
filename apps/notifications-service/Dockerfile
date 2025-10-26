# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/notifications-service/package.json ./apps/notifications-service/

RUN pnpm install --frozen-lockfile

FROM base AS development

WORKDIR /app/apps/notifications-service

EXPOSE 3004

CMD ["pnpm", "start:dev"]
