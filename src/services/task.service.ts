import tasks from '@/entities/tasks.entity';

function generateId() {
  if (tasks.length === 0) {
    return 1;
  }
  const lastTask = tasks[tasks.length - 1];
  return typeof lastTask.id === 'number' ? lastTask.id + 1 : tasks.length + 1;
}

export class TaskService {
  static addTasks(taskArray: any[]) {
    for (const task of taskArray) {
      const timestamp = new Date().toISOString();
      const id = generateId();
      tasks.push({
        ...task,
        id,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
    return { message: `${taskArray.length} task(s) added successfully` };
  }

  static deleteTasks(taskArray: any[]) {
    console.log(taskArray);
    const idsToDelete = taskArray.map((t) => t.id);
    const beforeCount = tasks.length;
    console.log(idsToDelete);
    for (const id of idsToDelete) {
      const index = tasks.findIndex((task) => task.id === id);
      if (index !== -1) {
        tasks.splice(index, 1);
      }
    }

    const deletedCount = beforeCount - tasks.length;
    return { message: `${deletedCount} task(s) deleted successfully` };
  }

  static getTasks(page: number = 1, limit: number = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    return {
      tasks: paginatedTasks,
      pagination: {
        totalTasks: tasks.length,
        currentPage: page,
        totalPages: Math.ceil(tasks.length / limit),
        pageSize: limit,
      },
    };
  }

  static updateTasks(taskArray: any[]) {
    let updatedCount = 0;
    console.log(taskArray);
    for (const updatedTask of taskArray) {
      const index = tasks.findIndex((t) => t.id === updatedTask.id);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          ...updatedTask,
          updated_at: new Date().toISOString(),
        };
        updatedCount++;
      }
    }

    return { message: `${updatedCount} task(s) updated successfully`, tasks };
  }
}
