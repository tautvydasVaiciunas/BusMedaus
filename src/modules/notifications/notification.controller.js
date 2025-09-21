import { authenticate, requireRole } from '../../common/middleware/authentication.js';

export function registerNotificationRoutes(app, { authService, notificationService }) {
  const ensureAuth = authenticate(authService);

  app.get('/notifications', ensureAuth, async (req, res) => {
    const notifications = await notificationService.listForUser(req.user.id);
    res.json({ data: notifications });
  });

  app.post('/notifications', ensureAuth, requireRole(['ADMIN', 'BEEKEEPER']), async (req, res) => {
    const notification = await notificationService.createNotification(req.body);
    req.metadata = { entity: 'Notification', entityId: notification.id };
    res.status(201).json(notification);
  });

  app.patch('/notifications/:id/read', ensureAuth, async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    req.metadata = { entity: 'Notification', entityId: notification.id };
    res.json(notification);
  });
}

export default registerNotificationRoutes;
