import { Suspense } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationsStore } from '@/stores/notifications-store'
import { NotificationList } from './notification-list'

const NotificationListSkeleton = () => (
  <div className='p-4 space-y-4'>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className='flex gap-4'>
        <Skeleton className='h-8 w-8 rounded-full flex-shrink-0' />
        <div className='flex-1 space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-3 w-20' />
        </div>
      </div>
    ))}
  </div>
)

export const NotificationBell = () => {
  const unreadCount = useNotificationsStore((state) => state.unreadCount)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-semibold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Suspense fallback={<NotificationListSkeleton />}>
          <NotificationList />
        </Suspense>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
