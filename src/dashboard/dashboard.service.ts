import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { HivesRepository } from '../hives/hives.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationStatus } from '../notifications/notification.entity';
import { MediaService } from '../media/media.service';
import { MessagingService } from '../messaging/messaging.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskStatus } from '../tasks/task-status.enum';
import { formatTaskPriorityLabel, formatTaskStatusLabel, formatUserDisplayName } from '../tasks/task.presenter';
import type { DashboardSnapshot, DashboardStat, DashboardTask, DashboardAlert } from './types';

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 0 }).format(value);

const formatDate = (value: Date | null | undefined): string => {
  if (!value) {
    return 'Nenurodytas terminas';
  }
  return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(value);
};

const formatDateTime = (value: Date): string =>
  new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium', timeStyle: 'short' }).format(value);

const mapNotificationSeverity = (metadata: Record<string, unknown> | null | undefined, status: NotificationStatus) => {
  const severity =
    typeof metadata === 'object' && metadata && 'severity' in metadata && typeof metadata.severity === 'string'
      ? metadata.severity.toLowerCase()
      : '';

  if (severity === 'critical' || severity === 'high' || severity === 'aukštas' || severity === 'kritinis') {
    return 'kritinis';
  }
  if (severity === 'warning' || severity === 'medium' || severity === 'įspėjimas') {
    return 'įspėjimas';
  }

  if (status === NotificationStatus.FAILED) {
    return 'kritinis';
  }
  if (status === NotificationStatus.PENDING) {
    return 'įspėjimas';
  }

  return 'informacija';
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly hivesRepository: HivesRepository,
    private readonly tasksService: TasksService,
    private readonly notificationsService: NotificationsService,
    private readonly mediaService: MediaService,
    private readonly messagingService: MessagingService
  ) {}

  async getSnapshot(user: AuthenticatedUser): Promise<DashboardSnapshot> {
    const [hives, tasks, notifications, mediaItems, recentComments] = await Promise.all([
      this.hivesRepository.findAllForUser(user.userId),
      this.tasksService.listAccessibleTasks(user),
      this.notificationsService.listNotificationsForUser(user.userId),
      this.mediaService.listAccessible(user),
      this.messagingService.listRecentMessages(user)
    ]);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const openTasks = tasks.filter(
      (task) => task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED
    );
    const completedThisWeek = tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED && task.updatedAt >= weekAgo
    ).length;
    const recentMediaCount = mediaItems.filter((item) => {
      const captured = item.capturedAt ?? item.createdAt;
      return captured ? captured >= monthAgo : false;
    }).length;

    const stats: DashboardStat[] = [
      {
        id: 'active-hives',
        label: 'Aktyvūs aviliai',
        value: formatNumber(hives.length),
        trend: hives.length ? 'Stabilus rodiklis' : 'Pridėkite avilių',
        trendTone: hives.length ? 'neutral' : 'negative'
      },
      {
        id: 'open-tasks',
        label: 'Atviros užduotys',
        value: formatNumber(openTasks.length),
        trend:
          openTasks.length > 5
            ? 'Didelė apkrova – peržiūrėkite prioritetus'
            : openTasks.length
            ? 'Tvarkoma laiku'
            : 'Visos užduotys užbaigtos',
        trendTone: openTasks.length > 5 ? 'negative' : openTasks.length ? 'info' : 'positive'
      },
      {
        id: 'completed-week',
        label: 'Užbaigta per 7 d.',
        value: formatNumber(completedThisWeek),
        trend: completedThisWeek ? 'Progresas matomas' : 'Laukiama aktyvumo',
        trendTone: completedThisWeek ? 'positive' : 'neutral'
      },
      {
        id: 'media-month',
        label: 'Naujos medijos (30 d.)',
        value: formatNumber(recentMediaCount),
        trend: recentMediaCount ? 'Aktyvus dalinimasis' : 'Papildykite biblioteką',
        trendTone: recentMediaCount ? 'positive' : 'neutral'
      }
    ];

    const priorityTasks: DashboardTask[] = openTasks
      .filter((task) => task.priority >= 2)
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        const aDue = a.dueDate ? a.dueDate.getTime() : Infinity;
        const bDue = b.dueDate ? b.dueDate.getTime() : Infinity;
        return aDue - bDue;
      })
      .slice(0, 5)
      .map((task) => ({
        id: task.id,
        title: task.title,
        assignedTo: task.assignedTo ? formatUserDisplayName(task.assignedTo) : 'Nepriskirta',
        dueDate: formatDate(task.dueDate ?? null),
        status: formatTaskStatusLabel(task.status),
        priority: formatTaskPriorityLabel(task.priority)
      }));

    const alerts: DashboardAlert[] = notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((notification) => ({
        id: notification.id,
        title: notification.title,
        description: notification.body,
        type: mapNotificationSeverity(notification.metadata, notification.status),
        createdAt: formatDateTime(notification.createdAt)
      }));

    if (!alerts.length && recentComments.length) {
      const comment = recentComments[0];
      alerts.push({
        id: `comment-${comment.id}`,
        title: `Naujas komentaras užduočiai ${comment.task.title}`,
        description: comment.content.length > 120 ? `${comment.content.slice(0, 117)}...` : comment.content,
        type: 'informacija',
        createdAt: formatDateTime(comment.createdAt)
      });
    }

    return {
      stats,
      alerts,
      tasks: priorityTasks
    };
  }
}
