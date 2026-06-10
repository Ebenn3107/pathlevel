import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { LearningSession, CreateLearningInput, UpdateLearningInput } from '../types';

export interface UpdateSessionResult {
  session: LearningSession;
  newAchievements?: { code: string; title: string; icon: string }[];
}

export async function getSessions(): Promise<LearningSession[]> {
  const { data } = await api.get<ApiResponse<LearningSession[]>>('/learning');
  return data.data;
}

export async function createSession(input: CreateLearningInput): Promise<LearningSession> {
  const { data } = await api.post<ApiResponse<LearningSession>>('/learning', input);
  return data.data;
}

export async function updateSession(id: string, input: UpdateLearningInput): Promise<UpdateSessionResult> {
  const response = await api.patch(`/learning/${id}`, input);
  const body = response.data;
  return {
    session: body.data as LearningSession,
    newAchievements: body.newAchievements as { code: string; title: string; icon: string }[] | undefined,
  };
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/learning/${id}`);
}
