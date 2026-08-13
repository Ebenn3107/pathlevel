import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { Resource, CreateResourceInput, UpdateResourceInput, ResourceListParams } from '../types';

export async function getResources(params?: ResourceListParams): Promise<Resource[]> {
  const { data } = await api.get<ApiResponse<Resource[]>>('/resources', { params });
  return data.data;
}

export async function createResource(input: CreateResourceInput): Promise<Resource> {
  const { data } = await api.post<ApiResponse<Resource>>('/resources', input);
  return data.data;
}

export async function updateResource(id: string, input: UpdateResourceInput): Promise<Resource> {
  const { data } = await api.patch<ApiResponse<Resource>>(`/resources/${id}`, input);
  return data.data;
}

export async function deleteResource(id: string): Promise<void> {
  await api.delete(`/resources/${id}`);
}

export async function archiveResource(id: string): Promise<Resource> {
  const { data } = await api.post<ApiResponse<Resource>>(`/resources/${id}/archive`);
  return data.data;
}

export async function restoreResource(id: string): Promise<Resource> {
  const { data } = await api.post<ApiResponse<Resource>>(`/resources/${id}/restore`);
  return data.data;
}
