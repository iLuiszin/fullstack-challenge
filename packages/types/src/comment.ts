export interface Comment {
  id: string
  content: string
  taskId: string
  authorId: string
  createdAt: Date
}

export interface CreateCommentInput {
  content: string
  taskId?: string
  authorId?: string
  correlationId?: string
}

export interface PaginatedComments {
  comments: Comment[]
  total: number
  page: number
  size: number
  totalPages: number
}
