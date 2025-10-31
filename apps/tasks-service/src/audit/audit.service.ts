import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAudit } from '../entities/task-audit.entity';
import { AuditAction } from '@repo/types';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(TaskAudit)
    private readonly auditRepository: Repository<TaskAudit>,
  ) {}

  async logTaskCreated(taskId: string, performedBy: string): Promise<void> {
    const audit = this.auditRepository.create({
      taskId,
      action: AuditAction.CREATED,
      performedBy,
    });
    await this.auditRepository.save(audit);
  }

  async logTaskUpdated(
    taskId: string,
    changes: Record<string, unknown>,
    performedBy: string,
  ): Promise<void> {
    const audit = this.auditRepository.create({
      taskId,
      action: AuditAction.UPDATED,
      changes,
      performedBy,
    });
    await this.auditRepository.save(audit);
  }

  async logStatusChanged(
    taskId: string,
    previousStatus: string,
    newStatus: string,
    performedBy: string,
  ): Promise<void> {
    const audit = this.auditRepository.create({
      taskId,
      action: AuditAction.STATUS_CHANGED,
      changes: { previousStatus, newStatus },
      performedBy,
    });
    await this.auditRepository.save(audit);
  }

  async logTaskAssigned(
    taskId: string,
    assignedUserIds: string[],
    performedBy: string,
  ): Promise<void> {
    const audit = this.auditRepository.create({
      taskId,
      action: AuditAction.ASSIGNED,
      changes: { assignedUserIds },
      performedBy,
    });
    await this.auditRepository.save(audit);
  }

  async getTaskHistory(taskId: string): Promise<TaskAudit[]> {
    return this.auditRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });
  }
}

