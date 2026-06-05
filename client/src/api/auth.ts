import api from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@lifescore/shared';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<{ data: AuthResponse }>('/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post<{ data: AuthResponse }>('/auth/register', data);
  return res.data.data;
}
