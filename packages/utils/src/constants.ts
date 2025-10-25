export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3004';

export const TOKEN_STORAGE_KEY = 'auth_tokens';

export const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

export const RATE_LIMIT_PER_SECOND = 10;

export const PASSWORD_MIN_LENGTH = 8;

export const USERNAME_MIN_LENGTH = 3;

export const USERNAME_MAX_LENGTH = 30;

export const TASK_TITLE_MAX_LENGTH = 200;

export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export const COMMENT_MAX_LENGTH = 1000;
