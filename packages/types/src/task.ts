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
  username?: string
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
  creatorName?: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateTaskInput {
  title: string
  description?: string
  deadline?: Date
  priority: Priority
  status?: Status
  assignedUserIds?: string[]
  createdBy?: string
  correlationId?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  deadline?: Date
  priority?: Priority
  status?: Status
  assignedUserIds?: string[]
  updatedBy?: string
  correlationId?: string
}

export interface TaskFilterParams {
  priority?: Priority
  status?: Status
  assigneeId?: string
  search?: string
  page?: number
  size?: number
}

export interface PaginatedTasks {
  tasks: Task[]
  total: number
  page: number
  size: number
  totalPages: number
}
