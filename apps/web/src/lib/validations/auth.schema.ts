import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido').transform(val => val.toLowerCase().trim()),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido').transform(val => val.toLowerCase().trim()),
  username: z
    .string()
    .min(2, 'O nome de usuário deve ter pelo menos 2 caracteres'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
