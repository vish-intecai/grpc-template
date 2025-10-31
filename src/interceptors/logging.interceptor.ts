import * as grpc from '@grpc/grpc-js';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';

// Directory to store raw request bodies, e.g., ./logs/requests
const logsDir = path.resolve(__dirname, '../../logs');
const requestsLogDir = path.join(logsDir, 'requests');

// Ensure requests log dir exists
if (!fs.existsSync(requestsLogDir)) {
  fs.mkdirSync(requestsLogDir, { recursive: true });
}

function writeRequestToFile(
  methodPath: string,
  peer: string,
  request: any,
  timestamp: number
) {
  // Sanitize methodPath and peer for filename
  const sanitizedMethod = methodPath.replace(/[^\w.-]/g, '_');
  const sanitizedPeer = peer.replace(/[^\w.-]/g, '_');
  const filename = `${timestamp}_${sanitizedMethod}_${sanitizedPeer}.json`;

  const filepath = path.join(requestsLogDir, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(request, null, 2));
  } catch (err) {
    logger.error(
      `[LoggingInterceptor] Failed to write request log to disk: ${err && (err as any).message}`
    );
  }
}

// Server-side logging interceptor compatible with our withInterceptors pipeline
export function loggingInterceptor(_options?: { logBody?: boolean }) {
  return async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
    next: (nextCallback?: grpc.sendUnaryData<any>) => Promise<void>
  ) => {
    const start = Date.now();
    const peer =
      typeof (call as any).getPeer === 'function'
        ? (call as any).getPeer()
        : 'unknown';

    // Best-effort method extraction without relying on private/internal fields
    const methodPath =
      ((call as any).handler && (call as any).handler.path) ||
      (call as any).method ||
      (Array.isArray(call?.metadata?.get(':path'))
        ? (call.metadata.get(':path')[0] as string)
        : undefined) ||
      'unknown';

    // Log the incoming request and its data (body)
    logger.info(
      `[gRPC] → ${methodPath} from ${peer} | Request: ${JSON.stringify(call.request)}`
    );

    // Store the request body to disk as well
    writeRequestToFile(methodPath, peer, call.request, start);

    // Wrap callback to measure duration and log outcome and response body
    const wrappedCallback: grpc.sendUnaryData<any> = (err, response) => {
      const durationMs = Date.now() - start;
      if (err) {
        const code = (err as any).code ?? grpc.status.UNKNOWN;
        const message = (err as any).message ?? 'Unknown error';
        logger.error(
          `[gRPC] ← ${methodPath} [${code}] (${durationMs}ms) - Error: ${message} | Response: ${JSON.stringify(response)}`
        );
      } else {
        logger.info(
          `[gRPC] ← ${methodPath} [0] (${durationMs}ms) | Response: ${JSON.stringify(response)}`
        );
      }
      callback(err as any, response);
    };

    await next(wrappedCallback);
  };
}
