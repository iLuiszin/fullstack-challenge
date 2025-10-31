import { Priority, Status } from '@repo/types';

export interface BaseEvent {
  correlationId: string;
  occurredAt: string;
  producer: string;
  schemaVersion: string;
}

export interface TaskCreatedEvent extends BaseEvent {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  priority: Priority;
  status: Status;
  assignedUserIds: string[];
  createdBy: string;
  creatorName?: string;
}

export interface TaskUpdatedEvent extends BaseEvent {
  id: string;
  title: string;
  assignedUserIds: string[];
  changes: {
    title?: string;
    description?: string;
    deadline?: string;
    priority?: Priority;
    status?: Status;
    assignedUserIds?: string[];
  };
  updatedBy: string;
  updaterName?: string;
  previousStatus?: Status;
  newStatus?: Status;
}

export interface CommentCreatedEvent extends BaseEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  content: string;
  authorId: string;
  authorName?: string;
  taskAssigneeIds: string[];
}
