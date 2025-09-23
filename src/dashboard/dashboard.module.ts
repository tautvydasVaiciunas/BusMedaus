import { Module } from '@nestjs/common';
import { HivesModule } from '../hives/hives.module';
import { MediaModule } from '../media/media.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [HivesModule, TasksModule, NotificationsModule, MediaModule, MessagingModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
