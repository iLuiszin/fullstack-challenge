import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, MessageSquare, Pencil, X } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import type { Notification, NotificationType } from '@repo/types'
import { notificationsApi } from '@/lib/api/notifications'
import { useNotificationsStore } from '@/stores/notifications-store'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
}

const getIconConfig = (type: NotificationType) => {
  switch (type) {
    case 'TASK_ASSIGNED':
      return {
        icon: <Bell className="h-4 w-4" />,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      }
    case 'TASK_UPDATED':
      return {
        icon: <Pencil className="h-4 w-4" />,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
      }
    case 'COMMENT_ADDED':
      return {
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
      }
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      }
  }
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const navigate = useNavigate()
  const markAsRead = useNotificationsStore((state) => state.markAsRead)
  const removeNotification = useNotificationsStore((state) => state.removeNotification)

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      markAsRead(notification.id)
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      removeNotification(notification.id)
    },
  })

  const handleClick = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }

    const metadata = notification.metadata as any
    if (metadata.taskId) {
      navigate({
        to: '/tasks/$taskId',
        params: { taskId: metadata.taskId },
      })
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotificationMutation.mutate(notification.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const iconConfig = getIconConfig(notification.type)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative w-full text-left px-4 py-4 cursor-pointer transition-all duration-200',
        'border-b last:border-b-0',
        'hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        !notification.isRead && 'bg-primary/5 border-l-2 border-l-primary pl-[14px]',
        notification.isRead && 'border-l-2 border-l-transparent'
      )}
    >
      <div className="flex gap-4 items-start">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
            iconConfig.bg
          )}
        >
          <div className={iconConfig.color}>{iconConfig.icon}</div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm leading-relaxed break-words">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {!notification.isRead && (
            <div
              className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm shadow-primary/50"
              aria-label="Não lida"
            />
          )}

          <button
            onClick={handleDelete}
            disabled={deleteNotificationMutation.isPending}
            className={cn(
              'p-1.5 rounded-md transition-all duration-200',
              'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Excluir notificação"
            title="Excluir notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
