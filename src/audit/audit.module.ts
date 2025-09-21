import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditLog } from './audit-log.entity';
import { AuditMiddleware } from './audit.middleware';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository, AuditMiddleware],
  exports: [AuditService, AuditRepository, AuditMiddleware]
})
export class AuditModule {}
