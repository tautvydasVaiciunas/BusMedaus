import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Hive } from '../hives/hive.entity';
import { User } from '../users/user.entity';
import { TaskStatus } from './task-status.enum';
import { Comment } from '../messaging/comment.entity';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'text', default: TaskStatus.TODO })
  status!: TaskStatus;

  @ManyToOne(() => Hive, (hive) => hive.tasks, { onDelete: 'CASCADE', eager: true })
  hive!: Hive;

  @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true, eager: true })
  assignedTo?: User | null;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
