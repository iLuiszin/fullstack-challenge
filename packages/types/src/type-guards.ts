import { ErrorCode } from './errors';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isValidErrorCode = (value: unknown): value is ErrorCode => {
  if (typeof value !== 'string') {
    return false;
  }

  return Object.values(ErrorCode).includes(value as ErrorCode);
};

export const hasValidMessage = (value: unknown): boolean =>
  typeof value === 'string' || isStringArray(value);
