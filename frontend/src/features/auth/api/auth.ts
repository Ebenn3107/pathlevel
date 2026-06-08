import api from '../../../services/api';
import type { ApiResponse } from '../../../types';
import type { AuthResponse, LoginInput, RegisterInput, AuthUser } from '../types';

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', input);
  return data.data;
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', input);
  return data.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}
