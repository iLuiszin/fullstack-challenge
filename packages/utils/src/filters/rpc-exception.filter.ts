import { Catch, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import type { MicroserviceError } from '@repo/types';
import { extractCode, extractErrorDetail, extractMessage } from '../error-extractors';

@Catch(RpcException)
export class RpcExceptionFilter {
  catch(exception: RpcException): Observable<never> {
    return throwError(() => exception.getError());
  }
}

@Catch(HttpException)
export class RpcHttpExceptionFilter {
  catch(exception: HttpException): Observable<never> {
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

    return throwError(() => new RpcException(payload));
  }
}
