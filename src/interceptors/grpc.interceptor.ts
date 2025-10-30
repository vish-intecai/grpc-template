import * as grpc from "@grpc/grpc-js";

export function withInterceptors(handler: any, interceptors: any[] = []) {
  return async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) => {
    let index = -1;
    let currentCallback: grpc.sendUnaryData<any> = callback;

    const runInterceptor = async (i: number) => {
      if (i <= index) {
        throw new Error("next() called multiple times in interceptor chain");
      }
      index = i;

      const interceptor = interceptors[i];
      if (interceptor) {
        // Allow interceptor to optionally provide a wrapped callback
        await interceptor(
          call,
          currentCallback,
          (nextCallback?: grpc.sendUnaryData<any>) => {
            if (typeof nextCallback === "function") {
              currentCallback = nextCallback;
            }
            return runInterceptor(i + 1);
          },
        );
      } else {
        await handler(call, currentCallback);
      }
    };

    try {
      await runInterceptor(0);
    } catch (error: any) {
      console.error("Interceptor error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message || "Internal server error",
      });
    }
  };
}
