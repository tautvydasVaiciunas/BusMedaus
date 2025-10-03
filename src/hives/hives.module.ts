import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { Hive } from './hive.entity';
import { HivesController } from './hives.controller';
import { HivesRepository } from './hives.repository';
import { HivesService } from './hives.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hive]), UsersModule, NotificationsModule, AuthModule],
  controllers: [HivesController],
  providers: [HivesService, HivesRepository],
  exports: [HivesService, HivesRepository]
})
export class HivesModule {}
