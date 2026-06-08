export interface AuthUser {
  id: string;
  email: string;
  username: string;
  xp?: number;
  level?: number;
  avatarUrl?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
