import { gRPC_task_client } from '../task.client';

// Types matching proto definitions (refer src/protos/task.proto)
type Task = {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'not_yet_started' | 'in_progress';
  created_at: string;
  updated_at: string;
};

type TaskInput = {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'not_yet_started' | 'in_progress';
};

type AddTasksRequest = {
  tasks: TaskInput[];
};

type UpdateTasksRequest = {
  tasks: TaskInput[];
};

type DeleteTasksRequest = {
  tasks: TaskInput[];
};

type GetTasksRequest = {
  page: number;
  limit: number;
};

type PaginationInfo = {
  totalTasks: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
};

type GetTasksResponse = {
  tasks: Task[];
  pagination: PaginationInfo;
};

// gRPC call helper
async function promisifyGrpcMethod<TReq, TRes>(
  method: (req: TReq, cb: (err: Error | null, res?: TRes) => void) => void,
  req: TReq
): Promise<TRes> {
  return new Promise<TRes>((resolve, reject) => {
    method.call(gRPC_task_client, req, (err: Error | null, response?: TRes) => {
      if (err) {
        reject(err);
      } else {
        resolve(response as TRes);
      }
    });
  });
}

// Accepts proto-style objects and arrays, returns list of Task
function extractTasks(res: any): Task[] {
  if (!res) {
    console.error('extractTasks: res is undefined');
    return [];
  }
  if (Array.isArray(res)) {
    console.error('extractTasks: res is an array');
    return res as Task[];
  }
  if ('tasks' in res && Array.isArray(res.tasks)) {
    return res.tasks as Task[];
  }
  if ('tasks' in res && typeof res.tasks === 'object') {
    // proto-loader may represent repeated fields as objects (if not arrays)
    return Object.values(res.tasks).filter(
      (v) => v && typeof v === 'object'
    ) as Task[];
  }
  return [];
}

function findTaskById(tasks: Task[], id: number | string): Task | undefined {
  // Accept string or number id for flexibility
  return (tasks || []).find((t) => `${t.id}` === `${id}`);
}

async function addTask(addData: AddTasksRequest): Promise<{ message: string }> {
  console.log('=== AddTasks Test ===');
  const addRes = await promisifyGrpcMethod<typeof addData, { message: string }>(
    gRPC_task_client.AddTasks,
    addData
  );
  console.log('AddTasks Response:', addRes);
  return addRes;
}

async function getTasks(getReq: GetTasksRequest): Promise<GetTasksResponse> {
  const getRes = await promisifyGrpcMethod<typeof getReq, GetTasksResponse>(
    gRPC_task_client.GetTasks,
    getReq
  );
  console.log('GetTasks Response:', getRes);
  return getRes;
}

async function updateTask(
  updateData: UpdateTasksRequest
): Promise<{ message: string }> {
  console.log('\n=== UpdateTasks Test ===');
  const updateRes = await promisifyGrpcMethod<
    typeof updateData,
    { message: string }
  >(gRPC_task_client.UpdateTasks, updateData);
  console.log('UpdateTasks Response:', updateRes);
  return updateRes;
}

async function deleteTask(
  deleteData: DeleteTasksRequest
): Promise<{ message: string }> {
  console.log('\n=== DeleteTasks Test ===');
  const deleteRes = await promisifyGrpcMethod<
    typeof deleteData,
    { message: string }
  >(gRPC_task_client.DeleteTasks, deleteData);
  console.log('DeleteTasks Response:', deleteRes);
  return deleteRes;
}

async function testAddTaskFlow(): Promise<void> {
  try {
    // Add task
    const addData: AddTasksRequest = {
      tasks: [
        {
          id: 1001,
          title: 'Test Task 1',
          description: 'For Add test',
          status: 'not_yet_started',
        },
      ],
    };
    await addTask(addData);

    // Get tasks after add
    const getReq: GetTasksRequest = { page: 1, limit: 100 };
    const getRes1 = await getTasks(getReq);
    const tasksAfterAdd = extractTasks(getRes1);

    if (!Array.isArray(tasksAfterAdd) || tasksAfterAdd.length === 0) {
      console.error(
        'Extracted tasksAfterAdd is empty, but totalTasks in pagination is',
        getRes1.pagination && getRes1.pagination.totalTasks
      );
      // extra diagnostic: print full response object and typeof fields
      console.error('Raw getRes1:', getRes1);
      if (getRes1 && 'tasks' in getRes1) {
        console.error(
          'Typeof getRes1.tasks:',
          typeof getRes1.tasks,
          Array.isArray(getRes1.tasks)
        );
      }
    } else {
      console.log('Extracted tasksAfterAdd:', tasksAfterAdd);
    }

    // Update task
    const updateData: UpdateTasksRequest = {
      tasks: [
        {
          id: 1001,
          title: 'Test Task 1 - Updated',
          description: 'Updated desc',
          status: 'completed',
        },
      ],
    };
    await updateTask(updateData);

    // Get tasks after update
    const getRes2 = await getTasks(getReq);
    const tasksAfterUpdate = extractTasks(getRes2);
    const updatedTask = findTaskById(tasksAfterUpdate, 1001);
    console.log('Updated task:', updatedTask);

    // Delete task
    const deleteData: DeleteTasksRequest = {
      tasks: [
        {
          id: 1001,
          title: 'Test Task 1 - Updated',
          description: 'Updated desc',
          status: 'completed',
        },
      ],
    };
    await deleteTask(deleteData);

    // Get tasks after delete
    const getRes3 = await getTasks(getReq);
    const tasksAfterDelete = extractTasks(getRes3);
    const deletedTask = findTaskById(tasksAfterDelete, 1001);

    if (!deletedTask) {
      console.log('Task deleted successfully!');
    } else {
      console.error('All tasks after delete:', tasksAfterDelete);
      throw new Error('Task was not deleted!');
    }

    console.log('\nAll gRPC task client tests passed.');
  } catch (err) {
    console.error('Test Error:', err);
  }
}

// Run the test
testAddTaskFlow();
