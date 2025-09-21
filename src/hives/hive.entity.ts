import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { MediaItem } from '../media/media-item.entity';

export enum HiveStatus {
  ACTIVE = 'ACTIVE',
  MONITORED = 'MONITORED',
  INACTIVE = 'INACTIVE',
  NEEDS_ATTENTION = 'NEEDS_ATTENTION'
}

@Entity({ name: 'hives' })
export class Hive {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ default: '' })
  apiaryName!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', default: HiveStatus.ACTIVE })
  status!: HiveStatus;

  @Column({ nullable: true })
  queenStatus?: string;

  @Column({ nullable: true })
  temperament?: string;

  @Column({ type: 'smallint', nullable: true })
  healthScore?: number;

  @ManyToOne(() => User, (user) => user.ownedHives, { eager: true, onDelete: 'SET NULL' })
  owner!: User;

  @ManyToMany(() => User, (user) => user.memberHives, { eager: true })
  @JoinTable({ name: 'hive_members' })
  members!: User[];

  @OneToMany(() => Task, (task) => task.hive)
  tasks!: Task[];

  @OneToMany(() => MediaItem, (item) => item.hive)
  mediaItems!: MediaItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
