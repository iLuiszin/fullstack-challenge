import {
  IsString,
  IsUUID,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content', maxLength: 1000, example: 'This task looks good!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string

  @ApiPropertyOptional({ description: 'Task ID (set by API gateway)' })
  @IsOptional()
  @IsUUID('4')
  taskId?: string

  @ApiPropertyOptional({ description: 'Author ID (set by API gateway)' })
  @IsOptional()
  @IsUUID('4')
  authorId?: string

  @ApiPropertyOptional({ description: 'Correlation ID for tracing (set by API gateway)' })
  @IsOptional()
  @IsUUID('4')
  correlationId?: string
}
