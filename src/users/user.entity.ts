import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Hive } from '../hives/hive.entity';
import { Task } from '../tasks/task.entity';
import { Notification } from '../notifications/notification.entity';
import { NotificationSubscription } from '../notifications/notification-subscription.entity';
import { Comment } from '../messaging/comment.entity';
import { MediaItem } from '../media/media-item.entity';
import { RefreshToken } from '../auth/refresh-token.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: '' })
  firstName!: string;

  @Column({ default: '' })
  lastName!: string;

  @Column({ nullable: true })
  phoneNumber?: string | null;

  @Column()
  passwordHash!: string;

  @Column('simple-array')
  roles!: string[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Hive, (hive) => hive.owner)
  ownedHives!: Hive[];

  @ManyToMany(() => Hive, (hive) => hive.members)
  @JoinTable({ name: 'hive_members' })
  memberHives!: Hive[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  assignedTasks!: Task[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks!: Task[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => NotificationSubscription, (subscription) => subscription.user)
  notificationSubscriptions!: NotificationSubscription[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @OneToMany(() => MediaItem, (item) => item.uploader)
  mediaItems!: MediaItem[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}
