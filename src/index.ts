import configuration from "@/config";
import { TaskController } from "@/controllers/task.controller";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { withInterceptors } from "@/interceptors/grpc.interceptor";
import { loggingInterceptor } from "@/interceptors/logging.interceptor";
import fs from "fs";
import { rabbitmq } from "./helper/rabbitmq";
import { logger } from "./utils/logger";
import { connectPostgres } from "@/config/database/postgres";

export function startGrpcServer() {
  try {
    const protoPath = path.resolve(__dirname, "./protos/task.proto");

    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const grpcObject = grpc.loadPackageDefinition(packageDef) as any;
    const taskPackage = grpcObject.task;
    const server = new grpc.Server();
    server.addService(taskPackage.TaskService.service, {
      AddTasks: withInterceptors(TaskController.addTasks, [
        loggingInterceptor(),
      ]),
      DeleteTasks: withInterceptors(TaskController.deleteTasks, [
        loggingInterceptor(),
      ]),
      GetTasks: withInterceptors(TaskController.getTasks, [
        loggingInterceptor(),
      ]),
      UpdateTasks: withInterceptors(TaskController.updateTasks, [
        loggingInterceptor(),
      ]),
    });

    let serverCredentials: grpc.ServerCredentials;
    if (configuration.nodeEnv === "production") {
      const rootCert = fs.readFileSync(
        process.env.GRPC_ROOT_CERT || "./certs/ca.crt",
      );
      const key = fs.readFileSync(
        process.env.GRPC_SERVER_KEY || "./certs/server.key",
      );
      const cert = fs.readFileSync(
        process.env.GRPC_SERVER_CERT || "./certs/server.crt",
      );
      serverCredentials = grpc.ServerCredentials.createSsl(
        rootCert,
        [
          {
            private_key: key,
            cert_chain: cert,
          },
        ],
        false,
      );
      console.log("gRPC server using secure credentials (TLS)");
    } else {
      serverCredentials = grpc.ServerCredentials.createInsecure();
      console.log("gRPC server using insecure credentials (development mode)");
    }

    server.bindAsync(
      `${configuration.url}:${configuration.port}`,
      serverCredentials,
      (err, port) => {
        if (err) {
          console.error("Failed to start gRPC server:", err);
          return;
        }
        console.log(`gRPC Task Service running on port ${port}`);
      },
    );
    (async () => {
      try {
        await connectPostgres();
      } catch (err: any) {
        logger.error("Postgres connection failed", err.message);
      }
    })();
    (async () => {
      try {
        await rabbitmq.connect();
        logger.info("RabbitMQ connected successfully");
      } catch (err: any) {
        logger.error("RabbitMQ connection failed", err.message);
      }
    })();
  } catch (error) {
    console.error("Failed to start gRPC server:", error);
  }
}

startGrpcServer();
