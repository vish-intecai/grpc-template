interface Task {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'not_yet_started' | 'in_progress';
  created_at: string;
  updated_at: string;
}

const tasks: Task[] = [];
export default tasks;
