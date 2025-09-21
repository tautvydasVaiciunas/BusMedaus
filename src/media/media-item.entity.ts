import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  metadata?: string;

  @ManyToOne(() => Hive, (hive) => hive.mediaItems, { onDelete: 'CASCADE', eager: true })
  hive!: Hive;

  @ManyToOne(() => User, (user) => user.mediaItems, { eager: true })
  uploader!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
