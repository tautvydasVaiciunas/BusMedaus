import { authenticate, requireRole } from '../../common/middleware/authentication.js';

export function registerTaskRoutes(app, { authService, taskService }) {
  const ensureAuth = authenticate(authService);
  const taskManager = requireRole(['ADMIN', 'BEEKEEPER']);

  app.get('/hives/:hiveId/tasks', ensureAuth, async (req, res) => {
    const tasks = await taskService.listTasksForHive(req.params.hiveId);
    res.json({ data: tasks });
  });

  app.post('/hives/:hiveId/tasks', ensureAuth, taskManager, async (req, res) => {
    const task = await taskService.createTask(req.params.hiveId, req.body, req.user);
    req.metadata = { entity: 'Task', entityId: task.id };
    res.status(201).json(task);
  });

  app.get('/tasks/:taskId', ensureAuth, async (req, res) => {
    const task = await taskService.getTaskById(req.params.taskId);
    res.json(task);
  });

  app.patch('/tasks/:taskId', ensureAuth, taskManager, async (req, res) => {
    const task = await taskService.updateTask(req.params.taskId, req.body, req.user);
    req.metadata = { entity: 'Task', entityId: task.id };
    res.json(task);
  });

  app.patch('/tasks/:taskId/status', ensureAuth, taskManager, async (req, res) => {
    const { status } = req.body || {};
    const task = await taskService.updateStatus(req.params.taskId, status, req.user);
    req.metadata = { entity: 'Task', entityId: task.id };
    res.json(task);
  });

  app.post('/tasks/:taskId/comments', ensureAuth, async (req, res) => {
    const comment = await taskService.addComment(req.params.taskId, req.body?.body, req.user);
    req.metadata = { entity: 'TaskComment', entityId: comment.id };
    res.status(201).json(comment);
  });

  app.get('/tasks/:taskId/comments', ensureAuth, async (req, res) => {
    const comments = await taskService.listComments(req.params.taskId);
    res.json({ data: comments });
  });
}

export default registerTaskRoutes;
