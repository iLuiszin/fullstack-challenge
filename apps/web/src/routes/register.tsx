import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { RegisterForm } from '@/components/auth/register-form'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/tasks' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entre
          </Link>
        </p>
      </div>
    </div>
  )
}
