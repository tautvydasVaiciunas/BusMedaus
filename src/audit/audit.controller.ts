import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditService } from './audit.service';

interface AuditLogResponse {
  id: string;
  userId?: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin')
  async listAuditLogs(@Query('limit') limit?: string): Promise<AuditLogResponse[]> {
    const parsedLimit = limit ? Math.min(Number(limit), 500) : 100;
    const logs = await this.auditService.listRecent(Number.isNaN(parsedLimit) ? 100 : parsedLimit);
    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      details: this.safeParse(log.details),
      createdAt: log.createdAt
    }));
  }

  private safeParse(details: string): Record<string, unknown> | null {
    try {
      return JSON.parse(details);
    } catch (error) {
      return null;
    }
  }
}
