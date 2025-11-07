export interface TaskAudit {
  id: string;
  taskId: string;
  action: string;
  changes?: Record<string, unknown>;
  performedBy: string;
  createdAt: Date;
}

export enum AuditAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNED = 'ASSIGNED',
  DELETED = 'DELETED',
}

