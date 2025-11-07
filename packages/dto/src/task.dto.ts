import {
  IsString,
  IsDate,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
  IsNotEmpty,
} from 'class-validator'
import { Type } from 'class-transformer'
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger'
import { Priority, Status } from '@repo/types'
import { MinDate } from './validators/min-date.validator.js'

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    maxLength: 200,
    example: 'Implement user authentication',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @ApiPropertyOptional({
    description: 'Task description',
    maxLength: 2000,
    example: 'Add JWT-based authentication to the API',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string

  @ApiPropertyOptional({
    description: 'Task deadline',
    type: Date,
    example: '2099-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @MinDate(new Date(), { message: 'Deadline cannot be in the past' })
  deadline?: Date

  @ApiProperty({
    description: 'Task priority',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsEnum(Priority)
  priority!: Priority

  @ApiPropertyOptional({
    description: 'Task status (omit on create; defaults to TODO)',
    enum: Status,
    default: Status.TODO,
  })
  @IsEnum(Status)
  @IsOptional()
  status?: Status

  @ApiPropertyOptional({
    description: 'Array of user IDs assigned to this task',
    isArray: true,
    type: String,
    example: ['123e4567-e89b-42d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedUserIds?: string[]

  @ApiHideProperty()
  @IsOptional()
  @IsUUID('4')
  createdBy?: string

  @ApiHideProperty()
  @IsOptional()
  @IsUUID('4')
  correlationId?: string
}

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Task title',
    maxLength: 200,
    example: 'Updated task title',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string

  @ApiPropertyOptional({
    description: 'Task description',
    maxLength: 2000,
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @ApiPropertyOptional({
    description: 'Task deadline',
    type: Date,
    example: '2099-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @MinDate(new Date(), { message: 'Deadline cannot be in the past' })
  deadline?: Date

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: Priority,
    example: Priority.URGENT,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority

  @ApiPropertyOptional({
    description: 'Task status',
    enum: Status,
    example: Status.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status

  @ApiPropertyOptional({
    description: 'Array of user IDs assigned to this task',
    isArray: true,
    type: String,
    example: ['123e4567-e89b-42d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedUserIds?: string[]

  @ApiPropertyOptional({
    description: 'User ID who updated the task (set by API gateway)',
  })
  @IsOptional()
  @IsUUID('4')
  updatedBy?: string

  @ApiPropertyOptional({
    description: 'Correlation ID for tracing (set by API gateway)',
  })
  @IsOptional()
  @IsUUID('4')
  correlationId?: string
}

export class TaskFilters {
  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: Status,
    example: Status.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status

  @ApiPropertyOptional({
    description: 'Only tasks assigned to this user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string

  @ApiPropertyOptional({
    description: 'Search in title/description',
    example: 'authentication',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({
    description: 'Page size',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number
}
