import { authenticate } from '../../common/middleware/authentication.js';

export function registerMediaRoutes(app, { authService, mediaService }) {
  const ensureAuth = authenticate(authService);

  app.get('/media', ensureAuth, async (req, res) => {
    const showAll = req.query.all === '1';
    if (showAll && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can view all media assets' });
    }
    const assets = showAll ? await mediaService.listAll() : await mediaService.listForUser(req.user.id);
    res.json({ data: assets });
  });

  app.post('/media', ensureAuth, async (req, res) => {
    const asset = await mediaService.createMedia(req.body || {}, req.user);
    req.metadata = { entity: 'Media', entityId: asset.id };
    res.status(201).json(asset);
  });

  app.delete('/media/:id', ensureAuth, async (req, res) => {
    await mediaService.deleteMedia(req.params.id, req.user);
    req.metadata = { entity: 'Media', entityId: req.params.id };
    res.json({ success: true });
  });
}

export default registerMediaRoutes;
