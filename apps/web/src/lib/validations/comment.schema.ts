import { z } from 'zod'

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'O comentário não pode estar vazio')
    .max(1000, 'O comentário deve ter no máximo 1000 caracteres'),
})

export type CommentFormData = z.infer<typeof commentSchema>
