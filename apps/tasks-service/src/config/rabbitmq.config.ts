export const RABBITMQ_CONFIG = {
  urls: [process.env.RABBITMQ_URI || 'amqp://admin:admin@localhost:5672'],
  exchange: 'tasks.exchange',
  exchangeType: 'topic' as const,
  queue: 'tasks_queue',
  queueOptions: { durable: true },
  prefetchCount: 1,
  isGlobalPrefetchCount: true,
  connectionInitOptions: { wait: false },
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
  MAX_RETRIES: 3,
  BACKOFF_MS: 1000,
} as const;

export const OUTBOX_CONFIG = {
  POLL_INTERVAL_MS: parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '5000', 10),
  BATCH_SIZE: parseInt(process.env.OUTBOX_BATCH_SIZE || '50', 10),
} as const;