export const DEFAULT_RADIX = 10;

export const MICROSERVICE_HOSTS = {
  DEFAULT: 'localhost',
  AUTH: process.env.AUTH_SERVICE_HOST ?? 'localhost',
  TASKS: process.env.TASKS_SERVICE_HOST ?? 'localhost',
  NOTIFICATIONS: process.env.NOTIFICATIONS_SERVICE_HOST ?? 'localhost',
} as const;

export const MICROSERVICE_PORTS = {
  AUTH: 3002,
  TASKS: 3003,
  NOTIFICATIONS: 3004,
  API_GATEWAY: 3001,
} as const;

export const MICROSERVICE_CONFIG = {
  TIMEOUT_MS: 5000,
} as const;

export const API_CONFIG = {
  PREFIX: 'api',
  DEFAULT_PORT: 3001,
  DEFAULT_CORS_ORIGIN: 'http://localhost:3000',
} as const;

export const THROTTLE_CONFIG = {
  TTL_MS: 1000,
  REQUEST_LIMIT: 10,
} as const;

export const AUTH_THROTTLE_CONFIG = {
  TTL_MS: 60000,
  REGISTER_LIMIT: 5,
  LOGIN_LIMIT: 5,
  REFRESH_LIMIT: 10,
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
} as const;
