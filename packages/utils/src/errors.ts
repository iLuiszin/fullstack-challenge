import { HttpException } from '@nestjs/common';
import { ErrorCode } from '@repo/types';

export const throwRpcError = (
  statusCode: number,
  message: string,
  code?: ErrorCode,
  error?: unknown,
): never => {
  const payload: Record<string, unknown> = {
    message,
  };

  if (code) {
    payload.code = code;
  }

  if (error !== undefined) {
    payload.error = error;
  }

  throw new HttpException(payload, statusCode);
};
