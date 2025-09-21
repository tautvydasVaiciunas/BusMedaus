import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  use(req: Request & { user?: AuthenticatedUser }, res: Response, next: NextFunction): void {
    const start = Date.now();
    const action = `${req.method} ${req.originalUrl}`;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const body = this.redact(req.body);
      const details = {
        statusCode: res.statusCode,
        durationMs: duration,
        body,
        query: req.query
      };

      this.auditService
        .record(req.user?.userId ?? null, action, details)
        .catch(() => {
          /* errors are logged inside the service */
        });
    });

    next();
  }

  private redact(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    if (Array.isArray(body)) {
      return body.map((entry) => this.redact(entry));
    }

    return Object.fromEntries(
      Object.entries(body as Record<string, unknown>).map(([key, value]) => {
        if (typeof value === 'string' && ['password', 'refreshToken'].includes(key)) {
          return [key, '[REDACTED]'];
        }
        if (typeof value === 'object' && value !== null) {
          return [key, this.redact(value)];
        }
        return [key, value];
      })
    );
  }
}
