import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { LearningSession, LearningSummary, SessionWithSummary, CreateLearningInput, UpdateLearningInput } from '../types';
import type { Resource } from '../../resources/types';

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

/* ── Unit sessions ──────────────────────────────────────────── */
export async function getUnitSessions(unitId: string): Promise<SessionWithSummary[]> {
  const { data } = await api.get<ApiResponse<SessionWithSummary[]>>(`/learning/units/${unitId}/sessions`);
  return data.data;
}

/* ── Session resources ──────────────────────────────────────── */
export async function getSessionResources(sessionId: string): Promise<Resource[]> {
  const { data } = await api.get<ApiResponse<Resource[]>>(`/learning/${sessionId}/resources`);
  return data.data;
}

export async function linkResourceToSession(sessionId: string, resourceId: string): Promise<void> {
  await api.post(`/learning/${sessionId}/resources`, { resourceId });
}

export async function unlinkResourceFromSession(sessionId: string, resourceId: string): Promise<void> {
  await api.delete(`/learning/${sessionId}/resources/${resourceId}`);
}

/* ── Summaries ──────────────────────────────────────────────── */
export async function getSessionSummary(sessionId: string): Promise<LearningSummary | null> {
  const { data } = await api.get<ApiResponse<LearningSummary | null>>(`/learning/${sessionId}/summary`);
  return data.data;
}

export async function saveSessionSummary(sessionId: string, content: string): Promise<LearningSummary> {
  const { data } = await api.post<ApiResponse<LearningSummary>>(`/learning/${sessionId}/summary`, { content });
  return data.data;
}

export async function deleteSessionSummary(sessionId: string): Promise<void> {
  await api.delete(`/learning/${sessionId}/summary`);
}
