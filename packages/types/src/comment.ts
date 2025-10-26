import { IsString, MinLength, IsUUID } from 'class-validator';

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  userName?: string;
  createdAt: Date;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsString()
  @IsUUID()
  taskId!: string;
}

export interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
