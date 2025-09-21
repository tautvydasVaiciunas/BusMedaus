const { domainEvents } = require('../domainEvents');
const { logger } = require('../config');

function buildChannelsForUser(user, subject) {
  const channels = {};
  if (user && user.email) {
    channels.email = { to: user.email, subject };
  }
  if (user && Array.isArray(user.pushTokens) && user.pushTokens.length > 0) {
    channels.push = { tokens: user.pushTokens };
  }
  return channels;
}

async function handleTaskAssigned(notificationService, payload) {
  const { task, assignee, assignedBy } = payload;
  const title = `Nauja užduotis: ${task.title}`;
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
  const body = due
    ? `Jums priskirta užduotis „${task.title}“ su terminu ${due}.`
    : `Jums priskirta užduotis „${task.title}“.\nPradėkite darbą kuo greičiau.`;
  const metadata = {
    taskId: task.id,
    dueDate: task.dueDate || null,
    hiveId: task.hiveId || null,
    assignedBy: assignedBy ? assignedBy.name || assignedBy.id : null
  };
  metadata.html = `<p>Sveiki${assignee?.name ? `, ${assignee.name}` : ''}!</p><p>Jums priskirta nauja užduotis <strong>${task.title}</strong>.</p>${
    due ? `<p>Įvykdymo terminas: <strong>${due}</strong>.</p>` : ''
  }`;

  await notificationService.createNotification({
    userId: assignee.id,
    type: 'task.assigned',
    title,
    body,
    metadata,
    channels: buildChannelsForUser(assignee, title)
  });
}

async function handleTaskOverdue(notificationService, payload) {
  const { task, assignee } = payload;
  const title = `Vėluojanti užduotis: ${task.title}`;
  const body = `Užduoties „${task.title}“ terminas baigėsi ${task.dueDate}. Prašome imtis veiksmų.`;
  const metadata = {
    taskId: task.id,
    dueDate: task.dueDate,
    hiveId: task.hiveId || null
  };
  metadata.html = `<p>Užduoties <strong>${task.title}</strong> terminas (${task.dueDate}) yra pasibaigęs.</p><p>Naujinkite būseną sistemoje.</p>`;

  await notificationService.createNotification({
    userId: assignee.id,
    type: 'task.overdue',
    title,
    body,
    metadata,
    channels: buildChannelsForUser(assignee, title)
  });
}

async function handleHiveInspectionNote(notificationService, payload) {
  const { inspection, recipients } = payload;
  const title = `Naujas avilio ${inspection.hiveCode || inspection.hiveId} patikros įrašas`;
  const body = `Pridėta nauja pastaba apie avilio ${inspection.hiveCode || inspection.hiveId} patikrą.`;
  const metadata = {
    inspectionId: inspection.id,
    hiveId: inspection.hiveId,
    authorId: inspection.authorId || null
  };
  metadata.html = `<p>Pridėta nauja pastaba apie avilio <strong>${
    inspection.hiveCode || inspection.hiveId
  }</strong> patikrą.</p><p>${inspection.summary || ''}</p>`;

  for (const recipient of recipients || []) {
    await notificationService.createNotification({
      userId: recipient.id,
      type: 'hive.inspection.note',
      title,
      body,
      metadata,
      channels: buildChannelsForUser(recipient, title)
    });
  }
}

function registerNotificationEventHandlers(notificationService) {
  domainEvents.on(domainEvents.EVENTS.TASK_ASSIGNED, (payload) => {
    handleTaskAssigned(notificationService, payload).catch((err) =>
      logger.error('Failed to handle task assignment event', { error: err.message })
    );
  });

  domainEvents.on(domainEvents.EVENTS.TASK_OVERDUE, (payload) => {
    handleTaskOverdue(notificationService, payload).catch((err) =>
      logger.error('Failed to handle overdue event', { error: err.message })
    );
  });

  domainEvents.on(domainEvents.EVENTS.HIVE_INSPECTION_NOTE, (payload) => {
    handleHiveInspectionNote(notificationService, payload).catch((err) =>
      logger.error('Failed to handle hive inspection note event', { error: err.message })
    );
  });
}

module.exports = { registerNotificationEventHandlers };
