import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('task_audit')
export class TaskAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  taskId: string;

  @Column()
  action: string;

  @Column('jsonb', { nullable: true })
  changes?: Record<string, unknown>;

  @Column('uuid')
  performedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

