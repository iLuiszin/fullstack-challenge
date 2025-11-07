import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { NotificationType } from '@repo/types';
import type { NotificationMetadata } from '@repo/types';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column('text')
  message: string;

  @Column('jsonb', { nullable: true })
  metadata: NotificationMetadata;

  @Column({ default: false })
  @Index()
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
