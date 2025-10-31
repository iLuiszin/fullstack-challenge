import { RpcException } from '@nestjs/microservices';
import { ErrorCode, MicroserviceError } from '@repo/types';

export const throwRpcError = (
  statusCode: number,
  message: string,
  code?: ErrorCode,
  error?: unknown,
): never => {
  const payload: MicroserviceError = {
    statusCode,
    message,
  };

  if (code) {
    payload.code = code;
  }

  if (error !== undefined) {
    payload.error = error;
  }

  throw new RpcException(payload);
};
