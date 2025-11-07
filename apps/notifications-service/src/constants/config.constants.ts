export const DEFAULT_RADIX = 10;

export const NOTIFICATIONS_SERVICE_CONFIG = {
  DEFAULT_PORT: 3004,
  DEFAULT_TCP_PORT: 3005,
  DEFAULT_HOST: '0.0.0.0',
  DEFAULT_FRONTEND_URL: 'http://localhost:3000',
  WEBSOCKET_NAMESPACE: '/notifications',
} as const;

export const DATABASE_CONFIG = {
  TYPE: 'postgres' as const,
  DEFAULT_URL: 'postgres://postgres:password@localhost:5432/challenge_db',
  MIGRATIONS_TABLE_NAME: 'migrations_notifications',
} as const;

export const JWT_CONFIG = {
  FALLBACK_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
  DEFAULT_ACCESS_TOKEN_EXPIRY: '15m',
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
} as const;

export const RABBITMQ_CONFIG = {
  DEFAULT_URI: 'amqp://admin:admin@localhost:5672',
  EXCHANGE: 'notifications.exchange',
  EXCHANGE_TYPE: 'topic' as const,
  QUEUE: 'tasks_queue',
  PREFETCH_COUNT: 10,
  IS_GLOBAL_PREFETCH_COUNT: true,
  CONNECTION_WAIT: false,
  OUTBOX_POLL_INTERVAL_MS: 5000,
  OUTBOX_BATCH_SIZE: 50,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;
