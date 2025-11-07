import { apiClient } from '../api-client'
import type {
  PaginatedNotifications,
  NotificationQueryOptions,
} from '@repo/types'

export const notificationsApi = {
  getNotifications: async (options?: NotificationQueryOptions) => {
    const response = await apiClient.get<PaginatedNotifications>(
      '/api/notifications',
      {
        params: options,
      }
    )
    return response.data
  },

  markAsRead: async (notificationId: string) => {
    await apiClient.patch(`/api/notifications/${notificationId}/read`)
  },

  markAllAsRead: async () => {
    await apiClient.patch('/api/notifications/read-all')
  },

  deleteNotification: async (notificationId: string) => {
    await apiClient.delete(`/api/notifications/${notificationId}`)
  },

  deleteAllNotifications: async () => {
    await apiClient.delete('/api/notifications/all')
  },
}
