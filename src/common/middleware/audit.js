import { sanitizeForAudit } from '../utils/validators.js';

const METHODS_TO_AUDIT = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createAuditMiddleware(auditService) {
  return async (req, res, next) => {
    if (!METHODS_TO_AUDIT.has(req.method)) {
      return next();
    }

    const nativeRes = res.res;
    const payloadSnapshot = sanitizeForAudit(req.body);
    const start = Date.now();

    const finalize = async () => {
      nativeRes.removeListener('finish', finalize);
      nativeRes.removeListener('close', finalize);
      const statusCode = nativeRes.statusCode;
      if (statusCode >= 500) {
        return;
      }
      const duration = Date.now() - start;
      try {
        await auditService.record({
          userId: req.user ? req.user.id : null,
          action: `${req.method} ${req.path}`,
          entity: req.metadata.entity || null,
          entityId: req.metadata.entityId || null,
          method: req.method,
          path: req.path,
          statusCode,
          ip: req.socket?.remoteAddress || null,
          changes: {
            body: payloadSnapshot,
            duration,
          },
        });
      } catch (error) {
        console.error('Failed to record audit log', error);
      }
    };

    nativeRes.on('finish', finalize);
    nativeRes.on('close', finalize);
    return next();
  };
}

export default createAuditMiddleware;
