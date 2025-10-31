import {
  IsString,
  MinLength,
  IsUUID,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content', maxLength: 1000, example: 'This task looks good!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;

  @ApiPropertyOptional({ description: 'Task ID (set by API gateway)' })
  @IsOptional()
  @IsUUID('4')
  taskId?: string;

  @ApiPropertyOptional({ description: 'Author ID (set by API gateway)' })
  @IsOptional()
  @IsUUID('4')
  authorId?: string;

  @ApiPropertyOptional({ description: 'Correlation ID for tracing (set by API gateway)' })
  @IsOptional()
  @IsUUID('4')
  correlationId?: string;
}

export interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
