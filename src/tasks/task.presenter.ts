import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

export interface TaskUserPresenter {
  id: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  displayName: string;
}

export interface TaskPresenter {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  statusLabel: string;
  priority: number;
  priorityLabel: string;
  dueDate: string | null;
  inspectionId?: string;
  templateId?: string;
  hive: { id: string; name: string };
  assignedTo?: TaskUserPresenter | null;
  createdBy: TaskUserPresenter;
  createdAt: string;
  updatedAt: string;
}

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'laukiama',
  [TaskStatus.IN_PROGRESS]: 'vykdoma',
  [TaskStatus.COMPLETED]: 'užbaigta',
  [TaskStatus.BLOCKED]: 'kritinė',
  [TaskStatus.CANCELLED]: 'atšaukta'
};

export const formatTaskStatusLabel = (status: TaskStatus): string => TASK_STATUS_LABELS[status] ?? status;

export const formatTaskPriorityLabel = (priority: number): string => {
  if (priority >= 3) {
    return 'aukšta';
  }
  if (priority === 2) {
    return 'vidutinė';
  }
  return 'žema';
};

export const formatUserDisplayName = (user: {
  firstName?: string;
  lastName?: string;
  email: string;
}): string => {
  const parts = [user.firstName, user.lastName].filter((part) => part && part.trim());
  if (parts.length) {
    return parts.join(' ');
  }
  return user.email;
};

const mapUser = (user: {
  id: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
} | null | undefined): TaskUserPresenter | null => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    roles: user.roles,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: formatUserDisplayName(user)
  };
};

export const toTaskPresenter = (task: Task): TaskPresenter => ({
  id: task.id,
  title: task.title,
  description: task.description ?? undefined,
  status: task.status,
  statusLabel: formatTaskStatusLabel(task.status),
  priority: task.priority,
  priorityLabel: formatTaskPriorityLabel(task.priority),
  dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  inspectionId: task.inspectionId ?? undefined,
  templateId: task.templateId ?? undefined,
  hive: { id: task.hive.id, name: task.hive.name },
  assignedTo: mapUser(task.assignedTo),
  createdBy: mapUser(task.createdBy)!,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString()
});

export const toTaskPresenterList = (tasks: Task[]): TaskPresenter[] => tasks.map(toTaskPresenter);
