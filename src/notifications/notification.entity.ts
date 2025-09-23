import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ'
}

export interface NotificationDeliveryDetail {
  status: NotificationStatus;
  attempts: number;
  lastAttemptAt: string;
  providerMessageId?: string;
  lastError?: string;
  extra?: Record<string, unknown>;
}

export type NotificationDeliveryMap = Partial<Record<NotificationChannel, NotificationDeliveryDetail>>;

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'text', default: NotificationChannel.IN_APP })
  channel!: NotificationChannel;

  @Column({ type: 'text', default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Column()
  title!: string;

  @Column('text')
  body!: string;

  @Column({ nullable: true })
  relatedTaskId?: string;

  @Column({ nullable: true })
  relatedInspectionId?: string;

  @Column({ nullable: true })
  relatedHarvestId?: string;

  @Column({ nullable: true })
  auditEventId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  deliveryMetadata?: NotificationDeliveryMap | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
