import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Hive } from '../hives/hive.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'media_items' })
export class MediaItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  url!: string;

  @Column()
  mimeType!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @ManyToOne(() => Hive, (hive) => hive.mediaItems, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'hiveId' })
  hive!: Hive;

  @Column({ nullable: true })
  inspectionId?: string;

  @Column({ nullable: true })
  taskId?: string;

  @Column({ nullable: true })
  harvestId?: string;

  @Column({ nullable: true })
  auditEventId?: string;

  @ManyToOne(() => User, (user) => user.mediaItems, { eager: true })
  @JoinColumn({ name: 'uploaderId' })
  uploader!: User;

  @Column({ type: 'datetime', nullable: true })
  capturedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
