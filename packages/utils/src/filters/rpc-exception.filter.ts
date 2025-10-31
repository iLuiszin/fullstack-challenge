import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { MicroserviceError } from '@repo/types';
import { extractCode, extractErrorDetail, extractMessage } from '../error-extractors';

@Catch(HttpException)
export class RpcHttpExceptionFilter {
  catch(exception: HttpException): never {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    const payload: MicroserviceError = {
      statusCode,
      message: extractMessage(response, exception.message),
    };

    const code = extractCode(response);
    if (code) {
      payload.code = code;
    }

    const errorDetail = extractErrorDetail(response);
    if (errorDetail !== undefined) {
      payload.error = errorDetail;
    }

    throw new RpcException(payload);
  }
}
