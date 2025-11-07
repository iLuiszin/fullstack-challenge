import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_assignees')
@Index(['taskId', 'userId'], { unique: true })
@Index(['userId'])
@Index(['taskId'])
export class TaskAssignee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'task_id' })
  taskId: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @Column('uuid', { name: 'assigned_by', nullable: true })
  assignedBy?: string;

  @Column({ length: 100, nullable: true })
  username?: string;

  @ManyToOne(() => Task, (task) => task.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;
}

