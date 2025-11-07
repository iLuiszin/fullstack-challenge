import { apiClient } from '../api-client'
import type {
  CreateTaskInput,
  UpdateTaskInput,
  Task,
  PaginatedTasks,
  TaskFilterParams,
  CreateCommentInput,
  PaginatedComments,
} from '@repo/types'

export const tasksApi = {
  getTasks: async (filters?: TaskFilterParams) => {
    const response = await apiClient.get<PaginatedTasks>('/api/tasks', {
      params: filters,
    })
    return response.data
  },

  getTasksByUser: async (userId: string, filters?: TaskFilterParams) => {
    const response = await apiClient.get<PaginatedTasks>(
      `/api/tasks/user/${userId}`,
      {
        params: filters,
      }
    )
    return response.data
  },

  getTask: async (taskId: string) => {
    const response = await apiClient.get<Task>(`/api/tasks/${taskId}`)
    return response.data
  },

  createTask: async (taskData: CreateTaskInput) => {
    const response = await apiClient.post<Task>('/api/tasks', taskData)
    return response.data
  },

  updateTask: async (taskId: string, taskData: UpdateTaskInput) => {
    const response = await apiClient.put<Task>(`/api/tasks/${taskId}`, taskData)
    return response.data
  },

  deleteTask: async (taskId: string) => {
    await apiClient.delete(`/api/tasks/${taskId}`)
  },

  createComment: async (taskId: string, content: string) => {
    const commentData: CreateCommentInput = { content }
    const response = await apiClient.post(
      `/api/tasks/${taskId}/comments`,
      commentData
    )
    return response.data
  },

  getComments: async (taskId: string, page = 1, size = 10) => {
    const response = await apiClient.get<PaginatedComments>(
      `/api/tasks/${taskId}/comments`,
      {
        params: { page, size },
      }
    )
    return response.data
  },
}
