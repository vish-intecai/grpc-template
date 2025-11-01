import * as grpc from '@grpc/grpc-js';
import { logger } from '@/utils/logger';

/**
 * Centralized gRPC error-handling interceptor
 * - Catches unhandled exceptions from handlers or previous interceptors
 * - Logs error details with stack trace
 * - Converts exceptions into gRPC-compliant error responses
 */
export function errorInterceptor() {
  return async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
    next: (nextCallback?: grpc.sendUnaryData<any>) => Promise<void>
  ) => {
    const methodPath =
      ((call as any).handler && (call as any).handler.path) ||
      (call as any).method ||
      'unknown';

    const peer =
      typeof (call as any).getPeer === 'function'
        ? (call as any).getPeer()
        : 'unknown';

    try {
      // Execute the next interceptor or handler
      await next(callback);
    } catch (err: any) {
      const code =
        err.code && typeof err.code === 'number'
          ? err.code
          : grpc.status.INTERNAL;

      const message =
        typeof err.message === 'string' ? err.message : 'Internal server error';

      logger.error(
        `[gRPC Error] ${methodPath} from ${peer} | Code: ${code} | Message: ${message} | Stack: ${
          err.stack || 'No stack trace'
        }`
      );

      callback({
        code,
        message,
      } as grpc.ServiceError);
    }
  };
}
