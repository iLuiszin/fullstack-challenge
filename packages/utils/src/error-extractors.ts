import {
  ErrorCode,
  isRecord,
  isStringArray,
  isValidErrorCode,
} from '@repo/types';

export const extractMessage = (
  response: unknown,
  fallback: string,
): string => {
  if (!isRecord(response)) {
    return fallback;
  }

  const message = response.message;
  if (typeof message === 'string') {
    return message;
  }

  if (isStringArray(message) && message.length > 0) {
    return message[0];
  }

  return fallback;
};

export const extractCode = (response: unknown): ErrorCode | undefined => {
  if (!isRecord(response)) {
    return undefined;
  }

  const code = response.code;
  if (!isValidErrorCode(code)) {
    return undefined;
  }

  return code;
};

export const extractErrorDetail = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return undefined;
  }

  return response.error;
};
