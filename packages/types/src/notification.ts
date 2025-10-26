import { IsString, IsEnum, IsOptional, IsObject, MinLength, IsUUID } from 'class-validator';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class CreateNotificationDto {
  @IsString()
  @IsUUID()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
