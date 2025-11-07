export const DEFAULT_RADIX = 10;

export const AUTH_SERVICE_CONFIG = {
  DEFAULT_PORT: 3002,
  DEFAULT_HOST: '0.0.0.0',
} as const;

export const DATABASE_CONFIG = {
  TYPE: 'postgres' as const,
  DEFAULT_URL: 'postgres://postgres:password@localhost:5432/challenge_db',
  MIGRATIONS_TABLE_NAME: 'migrations_auth',
} as const;

export const JWT_CONFIG = {
  DEFAULT_ACCESS_TOKEN_EXPIRY_SECONDS: 1800,
  DEFAULT_REFRESH_TOKEN_EXPIRY_SECONDS: 604800,
  FALLBACK_SECRET: 'development-jwt-secret-change-in-production',
  FALLBACK_REFRESH_SECRET: 'development-refresh-secret-change-in-production',
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
} as const;

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;
