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
  SMS = 'SMS'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ'
}

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

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'datetime', nullable: true })
  sentAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
