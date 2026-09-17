export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export interface RegisterResponseData {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export type LoginResponse = ApiResponse<LoginResponseData>;
export type RegisterResponse = ApiResponse<RegisterResponseData>;
export type MeResponse = ApiResponse<User>;
