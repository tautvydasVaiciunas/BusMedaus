import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Hive } from '../hives/hive.entity';
import { Task } from '../tasks/task.entity';
import { Notification } from '../notifications/notification.entity';
import { MediaItem } from '../media/media-item.entity';
import { Comment } from '../messaging/comment.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { AlignTypeormSchema1700000000000 } from '../migrations/1700000000000-align-typeorm-schema';

const getBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'busmedaus',
  ssl: getBoolean(process.env.DB_SSL) ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
  entities: [User, Hive, Task, Notification, MediaItem, Comment, RefreshToken],
  migrations: [AlignTypeormSchema1700000000000],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false
});
