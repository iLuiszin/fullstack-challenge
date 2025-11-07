import {
  hasValidMessage,
  isRecord,
  isValidErrorCode,
} from './type-guards.js';
import { ErrorCode, NetworkErrorCode } from './error-codes.js';

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
