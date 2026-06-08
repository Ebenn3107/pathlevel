export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  completed: boolean;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  completed?: boolean;
}
