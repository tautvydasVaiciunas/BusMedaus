import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
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

  @Column({ type: 'text', default: TaskStatus.PENDING })
  status!: TaskStatus;

  @Column({ type: 'int', default: 2 })
  priority!: number;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @ManyToOne(() => Hive, (hive) => hive.tasks, { onDelete: 'CASCADE', eager: true })
  hive!: Hive;

  @Column({ nullable: true })
  inspectionId?: string;

  @Column({ nullable: true })
  templateId?: string;

  @ManyToOne(() => User, (user) => user.createdTasks, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true, eager: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: User | null;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
