import { authenticate, requireRole } from '../../common/middleware/authentication.js';

export function registerUserRoutes(app, { authService, userService }) {
  const ensureAuth = authenticate(authService);

  app.get('/users/me', ensureAuth, async (req, res) => {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  });

  app.patch('/users/me', ensureAuth, async (req, res) => {
    const user = await userService.updateProfile(req.user.id, req.body || {});
    req.metadata = { entity: 'User', entityId: user.id };
    res.json(user);
  });

  app.get('/users', ensureAuth, requireRole('ADMIN'), async (_req, res) => {
    const users = await userService.listUsers();
    res.json({ data: users });
  });

  app.get('/users/:id', ensureAuth, requireRole('ADMIN'), async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  });

  app.patch('/users/:id/role', ensureAuth, requireRole('ADMIN'), async (req, res) => {
    const { role } = req.body || {};
    const user = await userService.changeRole(req.params.id, role);
    req.metadata = { entity: 'UserRole', entityId: user.id };
    res.json(user);
  });

  app.delete('/users/:id', ensureAuth, requireRole('ADMIN'), async (req, res) => {
    await userService.deleteUser(req.params.id);
    req.metadata = { entity: 'User', entityId: req.params.id };
    res.json({ success: true });
  });
}

export default registerUserRoutes;
