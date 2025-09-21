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

@Entity({ name: 'hives' })
export class Hive {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

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
