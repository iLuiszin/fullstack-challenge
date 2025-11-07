import type { TaskFilterParams, NotificationQueryOptions } from '@repo/types'

export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: TaskFilterParams) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    comments: (id: string) => [...queryKeys.tasks.detail(id), 'comments'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (options?: { search?: string; page?: number; size?: number }) =>
      [...queryKeys.users.lists(), options] as const,
    byIds: (ids: string[]) => [...queryKeys.users.all, 'byIds', ids] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (options?: NotificationQueryOptions) => 
      [...queryKeys.notifications.lists(), options] as const,
  },
} as const
