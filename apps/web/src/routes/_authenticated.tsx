import { useAuthStore } from '@/stores/auth-store'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <div className='flex h-screen'>
      <aside className='w-64 border-r'>Sidebar</aside>
      <main className='flex-1'>
        <Outlet />
      </main>
    </div>
  )
}
