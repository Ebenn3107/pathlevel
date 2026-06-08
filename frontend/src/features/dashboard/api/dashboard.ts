import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { DashboardSummary } from '../types';

export async function getDashboard(): Promise<DashboardSummary> {
  const { data } = await api.get<ApiResponse<DashboardSummary>>('/dashboard');
  return data.data;
}
