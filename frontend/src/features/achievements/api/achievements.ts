import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { Achievement, UserAchievement } from '../types';

export async function getAllAchievements(): Promise<Achievement[]> {
  const { data } = await api.get<ApiResponse<Achievement[]>>('/achievements');
  return data.data;
}

export async function getMyAchievements(): Promise<UserAchievement[]> {
  const { data } = await api.get<ApiResponse<UserAchievement[]>>('/achievements/me');
  return data.data;
}
