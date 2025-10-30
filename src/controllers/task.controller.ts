import { TaskService } from "@/services/task.service";

export class TaskController {
  static addTasks(call: any, callback: any) {
    const taskArray = call.request.tasks || [];
    if (!Array.isArray(taskArray)) {
      return callback({ code: 400, message: "tasks should be an array" });
    }

    const result = TaskService.addTasks(taskArray);
    callback(null, result);
  }

  static deleteTasks(call: any, callback: any) {
    const taskArray = call.request.tasks || [];
    console.log(taskArray);
    if (!Array.isArray(taskArray)) {
      return callback({ code: 400, message: "tasks should be an array" });
    }

    const result = TaskService.deleteTasks(taskArray);
    callback(null, result);
  }

  static getTasks(call: any, callback: any) {
    const { page = 1, limit = 10 } = call.request;
    const result = TaskService.getTasks(page, limit);
    callback(null, result);
  }

  static updateTasks(call: any, callback: any) {
    const taskArray = call.request.tasks || [];
    if (!Array.isArray(taskArray)) {
      return callback({ code: 400, message: "tasks should be an array" });
    }

    const result = TaskService.updateTasks(taskArray);
    callback(null, result);
  }
}
