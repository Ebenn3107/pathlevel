import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { Habit, CreateHabitInput, UpdateHabitInput } from '../types';

export async function getHabits(): Promise<Habit[]> {
  const { data } = await api.get<ApiResponse<Habit[]>>('/habits');
  return data.data;
}

export async function getHabit(id: string): Promise<Habit> {
  const { data } = await api.get<ApiResponse<Habit>>(`/habits/${id}`);
  return data.data;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const { data } = await api.post<ApiResponse<Habit>>('/habits', input);
  return data.data;
}

export async function updateHabit(id: string, input: UpdateHabitInput): Promise<Habit> {
  const { data } = await api.patch<ApiResponse<Habit>>(`/habits/${id}`, input);
  return data.data;
}

export async function deleteHabit(id: string): Promise<void> {
  await api.delete(`/habits/${id}`);
}

export interface CompleteHabitResult {
  habit: Habit;
  newAchievements?: { code: string; title: string; icon: string }[];
}

export async function completeHabit(id: string): Promise<CompleteHabitResult> {
  const response = await api.post(`/habits/${id}/complete`);
  const body = response.data;
  return {
    habit: body.data as Habit,
    newAchievements: body.newAchievements as { code: string; title: string; icon: string }[] | undefined,
  };
}
