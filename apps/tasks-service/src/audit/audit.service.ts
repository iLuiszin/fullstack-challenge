import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskAudit } from '../entities/task-audit.entity';
import { AuditAction } from '@repo/types';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(TaskAudit)
    private readonly auditRepository: Repository<TaskAudit>,
  ) {}

  async logTaskCreated(
    taskId: string,
    performedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(TaskAudit)
      : this.auditRepository;
    const audit = repository.create({
      taskId,
      action: AuditAction.CREATED,
      performedBy,
    });
    await repository.save(audit);
  }

  async logTaskUpdated(
    taskId: string,
    changes: Record<string, unknown>,
    performedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(TaskAudit)
      : this.auditRepository;
    const audit = repository.create({
      taskId,
      action: AuditAction.UPDATED,
      changes,
      performedBy,
    });
    await repository.save(audit);
  }

  async logStatusChanged(
    taskId: string,
    previousStatus: string,
    newStatus: string,
    performedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(TaskAudit)
      : this.auditRepository;
    const audit = repository.create({
      taskId,
      action: AuditAction.STATUS_CHANGED,
      changes: { previousStatus, newStatus },
      performedBy,
    });
    await repository.save(audit);
  }

  async logTaskAssigned(
    taskId: string,
    assignedUserIds: string[],
    performedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(TaskAudit)
      : this.auditRepository;
    const audit = repository.create({
      taskId,
      action: AuditAction.ASSIGNED,
      changes: { assignedUserIds },
      performedBy,
    });
    await repository.save(audit);
  }

  async getTaskHistory(taskId: string): Promise<TaskAudit[]> {
    return this.auditRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });
  }
}

