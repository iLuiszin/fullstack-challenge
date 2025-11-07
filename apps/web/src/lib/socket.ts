import { io, Socket } from 'socket.io-client'
import type { Notification, Priority, Status } from '@repo/types'
import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationsStore } from '@/stores/notifications-store'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3005'

let socket: Socket | null = null
let queryClient: QueryClient | null = null

interface TaskCreatedPayload {
  notification: Notification
  task: {
    id: string
    title: string
    priority: Priority
    status: Status
  }
}

interface TaskUpdatedPayload {
  notification: Notification
  task: {
    id: string
    title: string
    changes: Record<string, unknown>
  }
}

interface CommentNewPayload {
  notification: Notification
  comment: {
    id: string
    taskId: string
    content: string
    authorName: string
  }
}

interface ConnectedPayload {
  userId: string
}

export const setQueryClient = (client: QueryClient) => {
  queryClient = client
}

export const connectSocket = () => {
  const { accessToken } = useAuthStore.getState()

  if (!accessToken) {
    return
  }

  if (socket?.connected) {
    return socket
  }

  socket = io(`${WS_URL}/notifications`, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket', 'polling'],
  })

  socket.on('connected', (_payload: ConnectedPayload) => {
  })

  socket.on('disconnect', () => {
  })

  socket.on('task:created', (payload: TaskCreatedPayload) => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification(payload.notification)

    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
    }

    toast.success('Nova tarefa criada', {
      description: payload.task.title,
    })
  })

  socket.on('task:updated', (payload: TaskUpdatedPayload) => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification(payload.notification)

    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(payload.task.id) })
    }

    toast.info('Tarefa atualizada', {
      description: payload.task.title,
    })
  })

  socket.on('comment:new', (payload: CommentNewPayload) => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification(payload.notification)

    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(payload.comment.taskId) })
    }

    toast.info('Novo comentário', {
      description: `${payload.comment.authorName} comentou`,
    })
  })

  socket.on('error', (error: Error) => {
    toast.error('Erro na conexão WebSocket', {
      description: error.message,
    })
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket
