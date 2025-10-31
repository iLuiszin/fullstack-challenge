import { Priority, Status } from '@repo/types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskAssignee } from './task-assignee.entity';

@Entity('task')
@Index(['status'])
@Index(['priority'])
@Index(['createdBy'])
@Index(['createdAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.TODO,
  })
  status: Status;

  @Column('uuid')
  createdBy: string;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TaskAssignee, (assignee) => assignee.task, {
    cascade: true,
    eager: false,
  })
  assignees: TaskAssignee[];
}
