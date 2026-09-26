'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, MeResponse } from '@/lib/types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkingAuth: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(() => {
    // Initialize checkingAuth synchronously on client-side only
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('otewe_token');
    }
    return false;
  });

  useEffect(() => {
    const token = localStorage.getItem('otewe_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get<MeResponse>('/auth/me')
      .then((response) => {
        if (response.data.data) {
          setUser(response.data.data);
        }
      })
      .catch(() => {
        // Token invalid/expired - response interceptor handles 401 redirect
      })
      .finally(() => {
        setLoading(false);
        setCheckingAuth(false);
      });
  }, []);

  const login = async (data: LoginRequest) => {
    const loginResponse = await api.post<LoginResponse>('/auth/login', data);
    const loginData = loginResponse.data.data;
    if (!loginData) {
      throw new Error('Login response tidak valid');
    }
    const { token } = loginData;
    localStorage.setItem('otewe_token', token);

    const meResponse = await api.get<MeResponse>('/auth/me');
    const userData = meResponse.data.data;
    if (userData) {
      setUser(userData);
    }
  };

  const register = async (data: RegisterRequest) => {
    await api.post<RegisterResponse>('/auth/register', data);
  };

  const logout = () => {
    localStorage.removeItem('otewe_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkingAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return context;
}
