import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>
  ) {}

  private getRepo(manager?: EntityManager): Repository<AuditLog> {
    return manager ? manager.getRepository(AuditLog) : this.repository;
  }

  create(data: Partial<AuditLog>, manager?: EntityManager): AuditLog {
    return this.getRepo(manager).create(data);
  }

  save(log: AuditLog, manager?: EntityManager): Promise<AuditLog> {
    return this.getRepo(manager).save(log);
  }

  async findRecent(limit = 100): Promise<AuditLog[]> {
    return this.repository.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
