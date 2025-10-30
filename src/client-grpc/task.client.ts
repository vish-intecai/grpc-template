import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import configuration from "@/config";

const taskProtoPath = path.resolve(__dirname, "./protos/task.proto");

const packageDefinitionTask = protoLoader.loadSync(taskProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const taskProto: any = grpc.loadPackageDefinition(packageDefinitionTask).task;

const gRPC_task_client: any = new taskProto.TaskService(
  `${configuration.taskServicegRPCUrl}:${configuration.taskServicegRPCPort}`,
  grpc.credentials.createInsecure(),
);

export { gRPC_task_client };
