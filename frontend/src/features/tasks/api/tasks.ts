import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

export interface UpdateTaskResult {
  task: Task;
  newAchievements?: { code: string; title: string; icon: string }[];
}

export async function getTasks(): Promise<Task[]> {
  const { data } = await api.get<ApiResponse<Task[]>>('/tasks');
  return data.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await api.post<ApiResponse<Task>>('/tasks', input);
  return data.data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<UpdateTaskResult> {
  const response = await api.patch(`/tasks/${id}`, input);
  const body = response.data;
  return {
    task: body.data as Task,
    newAchievements: body.newAchievements as { code: string; title: string; icon: string }[] | undefined,
  };
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
