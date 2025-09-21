import { express } from './framework/express.js';
import { InMemoryDatabase } from './database/index.js';
import jsonParser from './common/middleware/json-parser.js';
import errorHandler from './common/middleware/error-handler.js';
import { authenticate } from './common/middleware/authentication.js';
import createAuditMiddleware from './common/middleware/audit.js';

import AuthService from './modules/auth/auth.service.js';
import UserService from './modules/users/user.service.js';
import HiveService from './modules/hives/hive.service.js';
import TaskService from './modules/tasks/task.service.js';
import NotificationService from './modules/notifications/notification.service.js';
import MessagingService from './modules/messaging/messaging.service.js';
import MediaService from './modules/media/media.service.js';
import AuditService from './modules/auditing/audit.service.js';

import registerAuthRoutes from './modules/auth/auth.controller.js';
import registerUserRoutes from './modules/users/user.controller.js';
import registerHiveRoutes from './modules/hives/hive.controller.js';
import registerTaskRoutes from './modules/tasks/task.controller.js';
import registerNotificationRoutes from './modules/notifications/notification.controller.js';
import registerMessagingRoutes from './modules/messaging/messaging.controller.js';
import registerMediaRoutes from './modules/media/media.controller.js';
import registerAuditRoutes from './modules/auditing/audit.controller.js';

const database = new InMemoryDatabase();

const authService = new AuthService(database);
const userService = new UserService(database);
const hiveService = new HiveService(database);
const taskService = new TaskService(database);
const notificationService = new NotificationService(database);
const messagingService = new MessagingService(database);
const mediaService = new MediaService(database);
const auditService = new AuditService(database);

const app = express();

app.use(async (req, _res, next) => {
  if (!req.metadata) {
    req.metadata = {};
  }
  return next();
});
app.use(jsonParser);
app.use(createAuditMiddleware(auditService));

registerAuthRoutes(app, { authService });
registerUserRoutes(app, { authService, userService });
registerHiveRoutes(app, { authService, hiveService });
registerTaskRoutes(app, { authService, taskService });
registerNotificationRoutes(app, { authService, notificationService });
registerMessagingRoutes(app, { authService, messagingService });
registerMediaRoutes(app, { authService, mediaService });
registerAuditRoutes(app, {
  auditService,
  authMiddleware: authenticate(authService),
});

app.useError(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`BusMedaus API listening on port ${PORT}`);
  });
}

export default app;
