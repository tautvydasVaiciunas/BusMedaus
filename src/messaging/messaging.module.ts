import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { Comment } from './comment.entity';
import { CommentsRepository } from './comments.repository';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), TasksModule, UsersModule, NotificationsModule],
  controllers: [MessagingController],
  providers: [MessagingService, CommentsRepository],
  exports: [MessagingService, CommentsRepository]
})
export class MessagingModule {}
