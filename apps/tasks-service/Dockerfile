# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/tasks-service/package.json ./apps/tasks-service/

RUN pnpm install --frozen-lockfile

FROM base AS development

WORKDIR /app/apps/tasks-service

EXPOSE 3003

CMD ["pnpm", "start:dev"]
