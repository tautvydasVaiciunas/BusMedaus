import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken]), forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository],
  exports: [AuthService]
})
export class AuthModule {}
