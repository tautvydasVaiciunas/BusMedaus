import { authenticate } from '../../common/middleware/authentication.js';

function requestMetadata(req) {
  return {
    ip: req.socket?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
  };
}

export function registerAuthRoutes(app, { authService }) {
  const ensureAuth = authenticate(authService);

  app.post('/auth/register', async (req, res) => {
    const result = await authService.register(req.body, requestMetadata(req));
    res.status(201).json(result);
  });

  app.post('/auth/login', async (req, res) => {
    const result = await authService.login(req.body, requestMetadata(req));
    res.json(result);
  });

  app.post('/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body || {};
    const result = await authService.refreshSession(refreshToken, requestMetadata(req));
    res.json(result);
  });

  app.post('/auth/logout', ensureAuth, async (req, res) => {
    await authService.logout(req.user.id);
    res.json({ success: true });
  });
}

export default registerAuthRoutes;
