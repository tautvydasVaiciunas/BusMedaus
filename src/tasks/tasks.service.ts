import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/notification.entity';
import { UsersService } from '../users/users.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { TasksRepository } from './tasks.repository';
import { HivesRepository } from '../hives/hives.repository';
import { Hive } from '../hives/hive.entity';

@Injectable()
export class TasksService {
  private static readonly CHANNEL_HINTS = [
    NotificationChannel.IN_APP,
    NotificationChannel.EMAIL,
    NotificationChannel.PUSH
  ];

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly hivesRepository: HivesRepository,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource
  ) {}

  async listTasksForHive(user: AuthenticatedUser, hiveId: string): Promise<Task[]> {
    const hive = await this.hivesRepository.findById(hiveId);
    if (!hive) {
      throw new NotFoundException(`Hive ${hiveId} not found`);
    }
    this.ensureHiveAccess(user, hive);
    return this.tasksRepository.findByHive(hiveId);
  }

  async getTask(user: AuthenticatedUser, taskId: string): Promise<Task> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    this.ensureHiveAccess(user, task.hive);
    return task;
  }

  async createTask(user: AuthenticatedUser, dto: CreateTaskDto): Promise<Task> {
    const task = await this.dataSource.transaction(async (manager) => {
      const hive = await this.hivesRepository.findById(dto.hiveId, manager);
      if (!hive) {
        throw new NotFoundException(`Hive ${dto.hiveId} not found`);
      }
      this.ensureHiveAccess(user, hive);

      const creator = await this.usersService.findByIdOrFail(user.userId, manager);

      let assignee = null;
      if (dto.assignedToId) {
        assignee = await this.usersService.findByIdOrFail(dto.assignedToId, manager);
        this.ensureUserInHive(assignee.id, hive);
      }

      const taskEntity = this.tasksRepository.create(
        {
          title: dto.title,
          description: dto.description,
          status: dto.status ?? TaskStatus.PENDING,
          priority: dto.priority ?? 2,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          hive,
          inspectionId: dto.inspectionId,
          templateId: dto.templateId,
          createdBy: creator,
          assignedTo: assignee
        },
        manager
      );

      return this.tasksRepository.save(taskEntity, manager);
    });

    if (task.assignedTo) {
      await this.notificationsService.notifyUsers([task.assignedTo.id], {
        title: `You were assigned to task ${task.title}`,
        body: `${task.createdBy.email} assigned you to ${task.title}.`,
        metadata: { taskId: task.id, hiveId: task.hive.id },
        channels: TasksService.CHANNEL_HINTS
      });
    }

    return task;
  }

  async updateTask(user: AuthenticatedUser, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const { task, notifyAssignee } = await this.dataSource.transaction(async (manager) => {
      const taskEntity = await this.tasksRepository.findById(taskId, manager);
      if (!taskEntity) {
        throw new NotFoundException(`Task ${taskId} not found`);
      }
      this.ensureTaskManageAccess(user, taskEntity);

      if (dto.title) {
        taskEntity.title = dto.title;
      }
      if (dto.description !== undefined) {
        taskEntity.description = dto.description;
      }

      let notifyAssignedUser: string | null = null;

      if (dto.unassign) {
        taskEntity.assignedTo = null;
      }

      if (dto.assignedToId !== undefined) {
        const previousAssignee = taskEntity.assignedTo?.id;
        const assignee = await this.usersService.findByIdOrFail(dto.assignedToId, manager);
        this.ensureUserInHive(assignee.id, taskEntity.hive);
        taskEntity.assignedTo = assignee;
        if (previousAssignee !== assignee.id) {
          notifyAssignedUser = assignee.id;
        }
      }

      if (dto.status) {
        taskEntity.status = dto.status;
      }

      if (dto.priority !== undefined) {
        taskEntity.priority = dto.priority;
      }

      if (dto.dueDate !== undefined) {
        taskEntity.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
      }

      if (dto.inspectionId !== undefined) {
        taskEntity.inspectionId = dto.inspectionId || undefined;
      }

      if (dto.templateId !== undefined) {
        taskEntity.templateId = dto.templateId || undefined;
      }

      const saved = await this.tasksRepository.save(taskEntity, manager);
      return { task: saved, notifyAssignee: notifyAssignedUser };
    });

    if (notifyAssignee) {
      await this.notificationsService.notifyUsers([notifyAssignee], {
        title: `You were assigned to task ${task.title}`,
        body: `${task.createdBy.email} assigned you to ${task.title}.`,
        metadata: { taskId: task.id, hiveId: task.hive.id },
        channels: TasksService.CHANNEL_HINTS
      });
    }

    return task;
  }

  async updateTaskStatus(user: AuthenticatedUser, taskId: string, dto: UpdateTaskStatusDto): Promise<Task> {
    const task = await this.dataSource.transaction(async (manager) => {
      const taskEntity = await this.tasksRepository.findById(taskId, manager);
      if (!taskEntity) {
        throw new NotFoundException(`Task ${taskId} not found`);
      }
      this.ensureTaskManageAccess(user, taskEntity);
      taskEntity.status = dto.status;
      return this.tasksRepository.save(taskEntity, manager);
    });

    const memberIds = task.hive.members.map((member) => member.id);
    await this.notificationsService.notifyUsers(memberIds, {
      title: `Task ${task.title} status changed`,
      body: `Task ${task.title} status changed to ${task.status}.`,
      metadata: { taskId: task.id, hiveId: task.hive.id },
      channels: TasksService.CHANNEL_HINTS
    });

    return task;
  }

  async removeTask(user: AuthenticatedUser, taskId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const task = await this.tasksRepository.findById(taskId, manager);
      if (!task) {
        throw new NotFoundException(`Task ${taskId} not found`);
      }
      this.ensureTaskManageAccess(user, task);
      await this.tasksRepository.remove(task, manager);
    });
  }

  private ensureHiveAccess(user: AuthenticatedUser, hive: Hive) {
    const isMember = hive.owner.id === user.userId || hive.members.some((member) => member.id === user.userId);
    const isAdmin = user.roles.includes('admin');
    if (!isMember && !isAdmin) {
      throw new ForbiddenException('You do not have access to this hive');
    }
  }

  private ensureTaskManageAccess(user: AuthenticatedUser, task: Task) {
    const isOwner = task.hive.owner.id === user.userId;
    const isAssignee = task.assignedTo?.id === user.userId;
    const hasRole = user.roles.includes('admin') || user.roles.includes('manager');
    if (!isOwner && !isAssignee && !hasRole) {
      throw new ForbiddenException('You do not have permission to manage this task');
    }
  }

  private ensureUserInHive(userId: string, hive: Hive) {
    const isMember = hive.owner.id === userId || hive.members.some((member) => member.id === userId);
    if (!isMember) {
      throw new ForbiddenException('Assignee must belong to the hive');
    }
  }
}
