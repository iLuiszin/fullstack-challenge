import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { useNotificationsStore } from '@/stores/notifications-store'
import { NotificationItem } from './notification-item'
import { useToast } from '@/hooks/use-toast'
import { queryKeys } from '@/lib/query-keys'
import { CheckCheck, Trash2, BellOff } from 'lucide-react'

export const NotificationList = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const notifications = useNotificationsStore((state) => state.notifications)
  const removeAllNotifications = useNotificationsStore((state) => state.removeAllNotifications)
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead)

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      markAllAsRead()
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast({
        title: 'Todas as notificações marcadas como lidas',
      })
    },
    onError: (error) => {
      toast({
        title: 'Falha ao marcar notificações',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: notificationsApi.deleteAllNotifications,
    onSuccess: () => {
      removeAllNotifications()
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast({
        title: 'Todas as notificações removidas',
      })
    },
    onError: (error) => {
      toast({
        title: 'Falha ao remover notificações',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    },
  })

  if (notifications.length === 0) {
    return (
      <div className='py-12 px-6 text-center'>
        <div className='flex justify-center mb-4'>
          <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center'>
            <BellOff className='h-6 w-6 text-muted-foreground' />
          </div>
        </div>
        <p className='text-sm font-medium text-foreground mb-1'>Nenhuma notificação</p>
        <p className='text-xs text-muted-foreground'>
          Você será notificado quando houver atualizações
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col max-h-[500px]'>
      <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold text-sm'>Notificações</h3>
          <div className='flex gap-1'>
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground h-9 w-9'
              aria-label='Marcar todas como lidas'
              title='Marcar todas como lidas'
            >
              <CheckCheck className='h-4 w-4' />
            </button>
            <button
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending}
              className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground h-9 w-9'
              aria-label='Limpar todas'
              title='Limpar todas'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      <div className='overflow-y-auto scroll-smooth'>
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  )
}
