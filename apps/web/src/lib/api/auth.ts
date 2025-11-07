import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserResponse,
} from '@repo/types'
import { apiClient } from '../api-client'

export const authApi = {
  login: async (credentials: LoginInput) => {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/login',
      credentials
    )
    return response.data
  },

  register: async (credentials: RegisterInput) => {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/register',
      credentials
    )
    return response.data
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<UserResponse>('/api/user')
    return response.data
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {
      refreshToken,
    })
    return response.data
  },
}
