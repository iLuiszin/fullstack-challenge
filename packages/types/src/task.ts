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

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  priority: Priority;
  status: Status;
  creatorId: string;
  assigneeIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  deadline: Date;
  priority: Priority;
  status: Status;
  assigneeIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  deadline?: Date;
  priority?: Priority;
  status?: Status;
  assigneeIds?: string[];
}

export interface TaskFilters {
  priority?: Priority;
  status?: Status;
  assigneeId?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
