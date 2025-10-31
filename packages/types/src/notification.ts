import { IsString, IsEnum, IsOptional, IsObject, MinLength, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority, Status } from './task';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

export const TRUNCATE_COMMENT_AT = 50;

export interface TaskAssignedMetadata {
  taskId: string;
  taskTitle: string;
  actorId: string;
  actorName: string;
}

export interface TaskUpdatedMetadata {
  taskId: string;
  taskTitle: string;
  actorId: string;
  actorName: string;
  changes: {
    title?: string;
    description?: string;
    deadline?: string;
    priority?: Priority;
    status?: Status;
    assignedUserIds?: string[];
  };
}

export interface CommentAddedMetadata {
  taskId: string;
  taskTitle: string;
  commentId: string;
  actorId: string;
  actorName: string;
}

export type NotificationMetadata =
  | TaskAssignedMetadata
  | TaskUpdatedMetadata
  | CommentAddedMetadata;

export interface TaskAssignedInput {
  taskId: string;
  taskTitle: string;
  assigneeIds: string[];
  creatorId: string;
  creatorName: string;
}

export interface TaskUpdatedInput {
  taskId: string;
  taskTitle: string;
  assigneeIds: string[];
  updaterId: string;
  updaterName: string;
  changes: {
    title?: string;
    description?: string;
    deadline?: string;
    priority?: Priority;
    status?: Status;
    assignedUserIds?: string[];
  };
}

export interface CommentAddedInput {
  taskId: string;
  taskTitle: string;
  commentId: string;
  commentContent: string;
  assigneeIds: string[];
  authorId: string;
  authorName: string;
}

export interface NotificationQueryOptions {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export interface NotificationPagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  metadata: NotificationMetadata;
  isRead: boolean;
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
  message!: string;

  @IsOptional()
  @IsObject()
  metadata?: NotificationMetadata;
}

export class NotificationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  pagination: NotificationPagination;
}
