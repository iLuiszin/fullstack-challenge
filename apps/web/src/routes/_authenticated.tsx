import { useAuthStore } from '@/stores/auth-store'
import { useNotificationsStore } from '@/stores/notifications-store'
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSocket } from '@/hooks/use-socket'
import Logo from '@/assets/logo.png'
import { LogOut } from 'lucide-react'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { notificationsApi } from '@/lib/api/notifications'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context: _context }) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const setNotifications = useNotificationsStore((state) => state.setNotifications)

  useSocket()

  const { data } = useSuspenseQuery({
    queryKey: queryKeys.notifications.list({ page: 1, size: 20 }),
    queryFn: () => notificationsApi.getNotifications({ page: 1, size: 20 }),
  })

  useEffect(() => {
    setNotifications(data.data)
  }, [data, setNotifications])

  // Invalidate notifications on mount to ensure fresh data after login
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  }, [queryClient])

  const handleLogout = () => {
    logout(queryClient)
    navigate({ to: '/login' })
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className='flex h-screen flex-col'>
      <header className='border-b bg-background'>
        <div className='flex h-16 items-center px-6 gap-4'>
          <div className='flex items-center gap-2'>
            <img
              src={Logo}
              alt='Gestão de Tarefas logo'
              className='h-10 w-auto'
            />
            <h1 className='text-xl font-bold'>Gestão de Tarefas</h1>
          </div>

          <div className='ml-auto flex items-center gap-4'>
            <NotificationBell />
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-10 w-10 rounded-full'
                  aria-label='Menu do usuário'
                >
                  <Avatar>
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none'>
                      {user?.username || 'Usuário'}
                    </p>
                    <p className='text-xs leading-none text-muted-foreground'>
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto'>
        <Outlet />
      </main>
    </div>
  )
}
