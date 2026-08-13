import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { Resource } from '../../resources/types';

/** Resource-first search for the authenticated user. */
export async function searchResources(q: string): Promise<Resource[]> {
  const { data } = await api.get<ApiResponse<Resource[]>>('/search', { params: { q } });
  return data.data;
}
