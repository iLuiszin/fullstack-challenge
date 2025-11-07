import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/login-form'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/tasks' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-md space-y-4'>
        <LoginForm />
        <p className='text-center text-sm text-muted-foreground'>
          Não tem uma conta?{' '}
          <Link
            to='/register'
            className='font-medium text-primary hover:underline'
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
