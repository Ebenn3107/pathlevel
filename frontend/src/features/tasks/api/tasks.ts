import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

export async function getTasks(): Promise<Task[]> {
  const { data } = await api.get<ApiResponse<Task[]>>('/tasks');
  return data.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await api.post<ApiResponse<Task>>('/tasks', input);
  return data.data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, input);
  return data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
