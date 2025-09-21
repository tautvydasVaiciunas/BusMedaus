import { requireRole } from '../../common/middleware/authentication.js';

export function registerAuditRoutes(app, { auditService, authMiddleware }) {
  app.get(
    '/admin/audit',
    authMiddleware,
    requireRole('ADMIN'),
    async (req, res) => {
      const result = await auditService.list(req.query);
      res.json(result);
    },
  );
}

export default registerAuditRoutes;
