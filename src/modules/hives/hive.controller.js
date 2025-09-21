import { authenticate, requireRole } from '../../common/middleware/authentication.js';

export function registerHiveRoutes(app, { authService, hiveService }) {
  const ensureAuth = authenticate(authService);
  const hiveManager = requireRole(['ADMIN', 'BEEKEEPER']);

  app.get('/hives', ensureAuth, async (_req, res) => {
    const hives = await hiveService.listHives();
    res.json({ data: hives });
  });

  app.get('/hives/:id', ensureAuth, async (req, res) => {
    const hive = await hiveService.getHiveById(req.params.id);
    res.json(hive);
  });

  app.post('/hives', ensureAuth, hiveManager, async (req, res) => {
    const hive = await hiveService.createHive(req.body, req.user);
    req.metadata = { entity: 'Hive', entityId: hive.id };
    res.status(201).json(hive);
  });

  app.patch('/hives/:id', ensureAuth, hiveManager, async (req, res) => {
    const hive = await hiveService.updateHive(req.params.id, req.body, req.user);
    req.metadata = { entity: 'Hive', entityId: hive.id };
    res.json(hive);
  });

  app.delete('/hives/:id', ensureAuth, requireRole('ADMIN'), async (req, res) => {
    await hiveService.deleteHive(req.params.id);
    req.metadata = { entity: 'Hive', entityId: req.params.id };
    res.json({ success: true });
  });
}

export default registerHiveRoutes;
