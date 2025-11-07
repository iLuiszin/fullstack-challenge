import { Priority, Status } from '@repo/types'
import { z } from 'zod'

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'O título é obrigatório')
    .max(200, 'O título deve ter no máximo 200 caracteres'),
  description: z
    .string()
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres')
    .optional(),
  deadline: z.date().optional(),
  priority: z.enum(Priority, {
    message: 'Selecione uma prioridade válida',
  }),
  status: z.enum(Status).optional(),
  assignedUserIds: z.array(z.string().uuid()).optional(),
})

export const updateTaskSchema = taskSchema.partial()

export type TaskFormData = z.infer<typeof taskSchema>
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>
