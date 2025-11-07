import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { MicroserviceError } from '@repo/types';
import {
  ErrorCode,
  isLegacyMicroserviceError,
  isMicroserviceError,
  isRecord,
  NetworkErrorCode,
  normalizeLegacyError,
} from '@repo/types';
import { extractCode, extractErrorDetail, extractMessage } from '@repo/utils';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  private readonly statusCodeToErrorCode: Record<number, ErrorCode> = {
    [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
    [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
    [HttpStatus.NOT_FOUND]: ErrorCode.RESOURCE_NOT_FOUND,
    [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_FAILED,
    [HttpStatus.GATEWAY_TIMEOUT]: ErrorCode.GATEWAY_TIMEOUT,
    [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
    [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_SERVER_ERROR,
  };

  private readonly networkErrorMap: Record<
    string,
    { status: number; message: string; code: ErrorCode }
  > = {
    [NetworkErrorCode.TIMEOUT]: {
      status: HttpStatus.GATEWAY_TIMEOUT,
      message: 'Gateway timeout',
      code: ErrorCode.GATEWAY_TIMEOUT,
    },
    [NetworkErrorCode.CONNECTION_REFUSED]: {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Service unavailable',
      code: ErrorCode.SERVICE_UNAVAILABLE,
    },
    [NetworkErrorCode.CONNECTION_RESET]: {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Service unavailable',
      code: ErrorCode.SERVICE_UNAVAILABLE,
    },
  };

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const payload = this.resolveError(exception);
    this.logError(request.method, request.url, payload, exception);

    response.status(payload.statusCode).json({
      statusCode: payload.statusCode,
      message: payload.message,
      ...(payload.code ? { code: payload.code } : {}),
      ...(payload.error !== undefined ? { error: payload.error } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }

  private resolveError(exception: unknown): MicroserviceError {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    const rpcError = this.fromRpcPayload(exception);
    if (rpcError) {
      return rpcError;
    }

    const networkError = this.fromNetworkError(exception);
    if (networkError) {
      return networkError;
    }

    if (exception instanceof Error) {
      return this.buildError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        exception.message,
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }

    return this.buildError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      ErrorCode.INTERNAL_SERVER_ERROR,
    );
  }

  private fromHttpException(exception: HttpException): MicroserviceError {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const message = extractMessage(response, exception.message);
    const code = extractCode(response) ?? this.deriveCodeFromStatus(statusCode);
    const errorDetail = extractErrorDetail(response);

    return this.buildError(statusCode, message, code, errorDetail);
  }

  private fromRpcPayload(exception: unknown): MicroserviceError | undefined {
    if (isRecord(exception) && 'error' in exception) {
      const nestedError = exception.error;
      if (isMicroserviceError(nestedError)) {
        return nestedError;
      }
      if (isLegacyMicroserviceError(nestedError)) {
        return normalizeLegacyError(nestedError);
      }
    }

    if (isMicroserviceError(exception)) {
      return exception;
    }

    if (isLegacyMicroserviceError(exception)) {
      return normalizeLegacyError(exception);
    }

    return undefined;
  }

  private fromNetworkError(exception: unknown): MicroserviceError | undefined {
    const code = this.extractNetworkCode(exception);
    if (!code) {
      return undefined;
    }

    const errorConfig = this.networkErrorMap[code];
    return errorConfig
      ? this.buildError(
          errorConfig.status,
          errorConfig.message,
          errorConfig.code,
        )
      : this.buildError(
          HttpStatus.SERVICE_UNAVAILABLE,
          'Service unavailable',
          ErrorCode.SERVICE_UNAVAILABLE,
        );
  }

  private buildError(
    statusCode: number,
    message: string,
    code?: ErrorCode,
    error?: unknown,
  ): MicroserviceError {
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

    return payload;
  }

  private deriveCodeFromStatus(status: number): ErrorCode | undefined {
    return this.statusCodeToErrorCode[status];
  }

  private extractNetworkCode(exception: unknown): string | undefined {
    if (isRecord(exception) && typeof exception.code === 'string') {
      return exception.code;
    }

    if (exception instanceof Error && 'code' in exception) {
      const errorAsRecord = exception as { code: unknown };
      if (typeof errorAsRecord.code === 'string') {
        return errorAsRecord.code;
      }
    }

    return undefined;
  }

  private logError(
    method: string,
    url: string,
    payload: MicroserviceError,
    exception: unknown,
  ): void {
    const context = `${method} ${url} -> ${payload.statusCode}`;
    const codeStr = payload.code ? ` [${payload.code}]` : '';
    const message = `${context} - ${payload.message}${codeStr}`;

    this.logger.error(message, this.serializeException(exception));
  }

  private serializeException(exception: unknown): string {
    if (!(exception instanceof Error)) {
      try {
        return JSON.stringify(exception);
      } catch {
        return String(exception);
      }
    }

    return JSON.stringify({
      name: exception.name,
      message: exception.message,
    });
  }
}
