import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../api/auth';
import type { AuthUser, LoginInput, RegisterInput } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  return localStorage.getItem('token');
}

function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginUser(input);
    setStoredToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerUser(input);
    setStoredToken(response.token);
    setUser(response.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
