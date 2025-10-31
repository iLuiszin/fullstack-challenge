import {
  hasValidMessage,
  isRecord,
  isValidErrorCode,
} from './type-guards';

export enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  NOTIFICATION_NOT_FOUND = 'NOTIFICATION_NOT_FOUND',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
}

export enum NetworkErrorCode {
  TIMEOUT = 'ETIMEDOUT',
  CONNECTION_REFUSED = 'ECONNREFUSED',
  CONNECTION_RESET = 'ECONNRESET',
}

export interface MicroserviceError {
  statusCode: number;
  message: string;
  code?: ErrorCode;
  error?: unknown;
}

export interface LegacyMicroserviceError {
  status?: number;
  statusCode?: number;
  message?: unknown;
  code?: unknown;
  error?: unknown;
}

export const isMicroserviceError = (
  value: unknown,
): value is MicroserviceError => {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.statusCode !== 'number') {
    return false;
  }

  if (!hasValidMessage(value.message)) {
    return false;
  }

  if (value.code !== undefined && typeof value.code !== 'string') {
    return false;
  }

  return true;
};

export const isLegacyMicroserviceError = (
  value: unknown,
): value is LegacyMicroserviceError => {
  if (!isRecord(value)) {
    return false;
  }

  const hasStatus =
    typeof value.status === 'number' || typeof value.statusCode === 'number';

  if (!hasStatus) {
    return false;
  }

  return hasValidMessage(value.message);
};

export const normalizeLegacyError = (
  value: LegacyMicroserviceError,
): MicroserviceError => {
  const status =
    typeof value.status === 'number'
      ? value.status
      : typeof value.statusCode === 'number'
        ? value.statusCode
        : 500;

  const rawMessage = value.message;
  const message =
    typeof rawMessage === 'string'
      ? rawMessage
      : Array.isArray(rawMessage) && rawMessage.length > 0
        ? rawMessage[0]
        : 'Internal server error';

  const code =
    typeof value.code === 'string' && isValidErrorCode(value.code)
      ? value.code
      : undefined;

  return {
    statusCode: status,
    message,
    code,
    error: value.error,
  };
};
