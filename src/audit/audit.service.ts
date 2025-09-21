import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository, private readonly dataSource: DataSource) {}

  async record(userId: string | null, action: string, details: Record<string, unknown>): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const log = this.auditRepository.create(
          {
            userId,
            action,
            details: JSON.stringify(details)
          },
          manager
        );
        await this.auditRepository.save(log, manager);
      });
    } catch (error) {
      this.logger.error('Failed to record audit log', error as Error);
    }
  }

  listRecent(limit = 100): Promise<AuditLog[]> {
    return this.auditRepository.findRecent(limit);
  }
}
