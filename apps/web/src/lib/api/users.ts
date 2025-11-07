import { apiClient } from '../api-client'
import type { UserResponse } from '@repo/types'

export interface PaginatedUsers {
  users: UserResponse[]
  total: number
  page: number
  size: number
  totalPages: number
}

export const usersApi = {
  getUsers: async (options?: { search?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<PaginatedUsers>('/api/users', {
      params: options,
    })
    return response.data
  },

  getUsersByIds: async (ids: string[]) => {
    if (ids.length === 0) return [] as UserResponse[]
    const response = await apiClient.get<PaginatedUsers>('/api/users', {
      params: { ids: ids.join(',') },
    })
    return response.data.users
  },
}

