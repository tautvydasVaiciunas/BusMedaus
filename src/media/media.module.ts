import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { HivesModule } from '../hives/hives.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { MediaController } from './media.controller';
import { MediaItem } from './media-item.entity';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

@Module({
  imports: [TypeOrmModule.forFeature([MediaItem]), HivesModule, UsersModule, NotificationsModule, AuthModule],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService, MediaRepository]
})
export class MediaModule {}
