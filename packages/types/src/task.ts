import {
  IsString,
  MinLength,
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
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger'
import { MinDate } from './validators/min-date.validator'

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export interface TaskAssignee {
  id: string
  taskId: string
  userId: string
  assignedAt: Date
  assignedBy?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  deadline?: Date
  priority: Priority
  status: Status
  assignees: TaskAssignee[]
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}

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
    example: '2026-12-31T23:59:59Z',
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
    description: 'Task status',
    enum: Status,
    example: Status.TODO,
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
    example: '2026-12-31T23:59:59Z',
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
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority

  @IsOptional()
  @IsEnum(Status)
  status?: Status

  @IsOptional()
  @IsString()
  assigneeId?: string

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number
}

export interface PaginatedTasks {
  tasks: Task[]
  total: number
  page: number
  size: number
  totalPages: number
}
