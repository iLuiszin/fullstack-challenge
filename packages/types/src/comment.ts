export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  userName?: string;
  createdAt: Date;
}

export interface CreateCommentDto {
  content: string;
  taskId: string;
}

export interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
