import { authenticate } from '../../common/middleware/authentication.js';

export function registerMessagingRoutes(app, { authService, messagingService }) {
  const ensureAuth = authenticate(authService);

  app.get('/threads', ensureAuth, async (req, res) => {
    const threads = await messagingService.listThreadsForUser(req.user.id);
    res.json({ data: threads });
  });

  app.post('/threads', ensureAuth, async (req, res) => {
    const thread = await messagingService.createThread(req.body, req.user);
    req.metadata = { entity: 'Thread', entityId: thread.id };
    res.status(201).json(thread);
  });

  app.post('/threads/:threadId/messages', ensureAuth, async (req, res) => {
    const message = await messagingService.postMessage(req.params.threadId, req.body?.body, req.user);
    req.metadata = { entity: 'Message', entityId: message.id };
    res.status(201).json(message);
  });

  app.get('/threads/:threadId/messages', ensureAuth, async (req, res) => {
    const messages = await messagingService.listMessages(req.params.threadId, req.user);
    res.json({ data: messages });
  });
}

export default registerMessagingRoutes;
