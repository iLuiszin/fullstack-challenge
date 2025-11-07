import { useToast } from '@/hooks/use-toast'
import { authApi } from '@/lib/api/auth'
import { registerSchema } from '@/lib/validations/auth.schema'
import type { RegisterFormData } from '@/lib/validations/auth.schema'
import { useAuthStore } from '@/stores/auth-store'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { apiErrorMessage } from '@/lib/api-errors'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Label } from '@radix-ui/react-label'
import { Input } from '../ui/input'
import { PasswordInput } from '../ui/password-input'
import { Button } from '../ui/button'

export function RegisterForm() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user
      )
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Bem-vindo!',
      })
      navigate({ to: '/tasks' })
    },
    onError: (error) => {
      toast({
        title: 'Falha no cadastro',
        description: apiErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar</CardTitle>
        <CardDescription>Crie sua conta para começar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='username'>Nome de Usuário</Label>
            <Input id='username' type='text' {...register('username')} />
            {errors.username && (
              <p className='text-sm text-destructive'>
                {errors.username.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>E-mail</Label>
            <Input id='email' type='text' {...register('email')} />
            {errors.email && (
              <p className='text-sm text-destructive'>{errors.email.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>Senha</Label>
            <PasswordInput
              id='password'
              autoComplete='new-password'
              {...register('password')}
            />
            {errors.password && (
              <p className='text-sm text-destructive'>
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            type='submit'
            className='w-full'
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
