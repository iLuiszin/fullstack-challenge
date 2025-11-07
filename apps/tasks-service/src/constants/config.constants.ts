export const DEFAULT_RADIX = 10;

export const TASKS_SERVICE_CONFIG = {
  DEFAULT_PORT: 3003,
  DEFAULT_HOST: '0.0.0.0',
} as const;

export const DATABASE_CONFIG = {
  TYPE: 'postgres' as const,
  DEFAULT_URL: 'postgres://postgres:password@localhost:5432/challenge_db',
  MIGRATIONS_TABLE_NAME: 'migrations_tasks',
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
} as const;

export const SORT_ORDER = {
  DESC: 'DESC' as const,
  ASC: 'ASC' as const,
} as const;

export const RABBITMQ_CONFIG = {
  DEFAULT_URI: 'amqp://admin:admin@localhost:5672',
  EXCHANGE: 'tasks.exchange',
  QUEUE: 'tasks_queue',
  PREFETCH_COUNT: 1,
  OUTBOX_POLL_INTERVAL_MS: 5000,
  OUTBOX_BATCH_SIZE: 50,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const AUTH_SERVICE_CONFIG = {
  DEFAULT_HOST: 'auth-service',
  DEFAULT_PORT: 3002,
  DEFAULT_TIMEOUT_MS: 5000,
} as const;

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;
