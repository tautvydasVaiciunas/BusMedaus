import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditMiddleware } from './audit/audit.middleware';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { MessagingModule } from './messaging/messaging.module';
import { MediaModule } from './media/media.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksModule } from './tasks/tasks.module';
import { HivesModule } from './hives/hives.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AppDataSource } from './database/data-source';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true
    }),
    AuditModule,
    AuthModule,
    UsersModule,
    HivesModule,
    TasksModule,
    NotificationsModule,
    MessagingModule,
    MediaModule,
    DashboardModule,
    HealthModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*');
  }
}
