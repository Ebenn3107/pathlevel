import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type {
  LearningGoal,
  LearningGoalDetail,
  LearningUnit,
  CreateGoalInput,
  UpdateGoalInput,
  CreateUnitInput,
} from '../types';

export async function getGoals(): Promise<LearningGoal[]> {
  const { data } = await api.get<ApiResponse<LearningGoal[]>>('/learning/goals');
  return data.data;
}

export async function getGoal(id: string): Promise<LearningGoalDetail> {
  const { data } = await api.get<ApiResponse<LearningGoalDetail>>(`/learning/goals/${id}`);
  return data.data;
}

export async function createGoal(input: CreateGoalInput): Promise<LearningGoal> {
  const { data } = await api.post<ApiResponse<LearningGoal>>('/learning/goals', input);
  return data.data;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<LearningGoal> {
  const { data } = await api.patch<ApiResponse<LearningGoal>>(`/learning/goals/${id}`, input);
  return data.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/learning/goals/${id}`);
}

export async function archiveGoal(id: string): Promise<LearningGoal> {
  const { data } = await api.post<ApiResponse<LearningGoal>>(`/learning/goals/${id}/archive`);
  return data.data;
}

export async function restoreGoal(id: string): Promise<LearningGoal> {
  const { data } = await api.post<ApiResponse<LearningGoal>>(`/learning/goals/${id}/restore`);
  return data.data;
}

export async function createUnit(goalId: string, input: CreateUnitInput): Promise<LearningUnit> {
  const { data } = await api.post<ApiResponse<LearningUnit>>(`/learning/goals/${goalId}/units`, input);
  return data.data;
}

export async function linkResourceToGoal(goalId: string, resourceId: string): Promise<void> {
  await api.post(`/learning/goals/${goalId}/resources`, { resourceId });
}

export async function unlinkResourceFromGoal(goalId: string, resourceId: string): Promise<void> {
  await api.delete(`/learning/goals/${goalId}/resources/${resourceId}`);
}
