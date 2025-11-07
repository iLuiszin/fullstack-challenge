import {
  DEFAULT_RADIX,
  RABBITMQ_CONFIG as RABBITMQ_DEFAULTS,
} from '../constants/config.constants';

export const RABBITMQ_CONFIG = {
  urls: [process.env.RABBITMQ_URI ?? RABBITMQ_DEFAULTS.DEFAULT_URI],
  exchange: RABBITMQ_DEFAULTS.EXCHANGE,
  exchangeType: RABBITMQ_DEFAULTS.EXCHANGE_TYPE,
  queue: RABBITMQ_DEFAULTS.QUEUE,
  queueOptions: { durable: true },
  prefetchCount: RABBITMQ_DEFAULTS.PREFETCH_COUNT,
  isGlobalPrefetchCount: RABBITMQ_DEFAULTS.IS_GLOBAL_PREFETCH_COUNT,
  connectionInitOptions: { wait: RABBITMQ_DEFAULTS.CONNECTION_WAIT },
};

export const ROUTING_KEYS = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  COMMENT_CREATED: 'comment.created',
} as const;

export const QUEUES = {
  DLQ: 'tasks.dlq',
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: RABBITMQ_DEFAULTS.RETRY_ATTEMPTS,
  BACKOFF_MS: RABBITMQ_DEFAULTS.RETRY_DELAY_MS,
} as const;

export const OUTBOX_CONFIG = {
  POLL_INTERVAL_MS: parseInt(
    process.env.OUTBOX_POLL_INTERVAL_MS ?? String(RABBITMQ_DEFAULTS.OUTBOX_POLL_INTERVAL_MS),
    DEFAULT_RADIX,
  ),
  BATCH_SIZE: parseInt(
    process.env.OUTBOX_BATCH_SIZE ?? String(RABBITMQ_DEFAULTS.OUTBOX_BATCH_SIZE),
    DEFAULT_RADIX,
  ),
} as const;
