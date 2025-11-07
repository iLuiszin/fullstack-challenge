import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { MicroserviceError } from '@repo/types';
import {
  isMicroserviceError,
  isLegacyMicroserviceError,
  normalizeLegacyError,
  isRecord,
} from '@repo/types';

@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((err) => {
        const rpcError = this.extractRpcError(err);

        if (rpcError) {
          throw new HttpException(
            {
              message: rpcError.message,
              ...(rpcError.code ? { code: rpcError.code } : {}),
              ...(rpcError.error !== undefined
                ? { error: rpcError.error }
                : {}),
            },
            rpcError.statusCode,
          );
        }

        return throwError(() => err);
      }),
    );
  }

  private extractRpcError(err: unknown): MicroserviceError | undefined {
    if (isRecord(err) && 'error' in err) {
      const nestedError = err.error;

      if (isMicroserviceError(nestedError)) {
        return nestedError;
      }

      if (isLegacyMicroserviceError(nestedError)) {
        return normalizeLegacyError(nestedError);
      }
    }

    if (isMicroserviceError(err)) {
      return err;
    }

    if (isLegacyMicroserviceError(err)) {
      return normalizeLegacyError(err);
    }

    return undefined;
  }
}
