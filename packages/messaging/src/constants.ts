export const MESSAGE_PATTERNS = {
  // Task RPC commands
  TASKS: {
    CREATE: 'tasks.create',
    UPDATE: 'tasks.update',
    FIND_BY_ID: 'tasks.findById',
    FIND_ALL: 'tasks.findAll',
    DELETE: 'tasks.delete',
  },

  // Comment RPC commands
  COMMENTS: {
    CREATE: 'tasks.comments.create',
    FIND_BY_TASK_ID: 'tasks.comments.findByTaskId',
  },

  // Task events (pub/sub)
  TASK_EVENTS: {
    CREATED: 'task.created',
    UPDATED: 'task.updated',
    COMMENT_CREATED: 'comment.created',
  },

  // User events (for future use if needed)
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
  },

  // Auth events (for future use if needed)
  AUTH: {
    REGISTER: 'auth.register',
    LOGIN: 'auth.login',
    REFRESH: 'auth.refresh',
    SIGN_OUT: 'auth.sign-out',
  },
} as const;

// Exchange names
export const EXCHANGES = {
  TASKS: 'tasks.exchange',
  USERS: 'users_exchange',
  AUTH: 'auth_exchange',
} as const;

// Queue names
export const QUEUES = {
  TASKS: 'tasks_queue',
  NOTIFICATIONS: 'notifications_queue',
  USERS: 'users_queue',
  TASKS_DLQ: 'tasks.dlq',
} as const;