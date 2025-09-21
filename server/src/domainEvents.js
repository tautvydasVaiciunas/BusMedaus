const EventEmitter = require('events');

class DomainEvents extends EventEmitter {}

const domainEvents = new DomainEvents();

domainEvents.EVENTS = {
  TASK_ASSIGNED: 'task.assigned',
  TASK_OVERDUE: 'task.overdue',
  HIVE_INSPECTION_NOTE: 'hive.inspection.note'
};

module.exports = { domainEvents };
