import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { LearningUnit, LearningUnitDetail, UpdateUnitInput } from '../types';

export async function getUnit(id: string): Promise<LearningUnitDetail> {
  const { data } = await api.get<ApiResponse<LearningUnitDetail>>(`/learning/units/${id}`);
  return data.data;
}

export async function updateUnit(id: string, input: UpdateUnitInput): Promise<LearningUnit> {
  const { data } = await api.patch<ApiResponse<LearningUnit>>(`/learning/units/${id}`, input);
  return data.data;
}

export async function deleteUnit(id: string): Promise<void> {
  await api.delete(`/learning/units/${id}`);
}

export async function linkResourceToUnit(unitId: string, resourceId: string): Promise<void> {
  await api.post(`/learning/units/${unitId}/resources`, { resourceId });
}

export async function unlinkResourceFromUnit(unitId: string, resourceId: string): Promise<void> {
  await api.delete(`/learning/units/${unitId}/resources/${resourceId}`);
}
