import { ForbiddenException } from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';
import { TasksService } from '../tasks.service';
import { TaskStatus } from '../task-status.enum';
import type { TasksRepository } from '../tasks.repository';
import type { NotificationsService } from '../../notifications/notifications.service';
import type { HivesRepository } from '../../hives/hives.repository';
import type { UsersService } from '../../users/users.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import type { Task } from '../task.entity';
import type { Hive } from '../../hives/hive.entity';
import type { User } from '../../users/user.entity';

describe('TasksService.updateTaskStatus', () => {
  let tasksService: TasksService;
  let tasksRepository: { findById: jest.Mock; save: jest.Mock };
  let notificationsService: { notifyUsers: jest.Mock };
  let transactionMock: jest.Mock;
  let manager: EntityManager;

  beforeEach(() => {
    tasksRepository = {
      findById: jest.fn(),
      save: jest.fn()
    };

    notificationsService = {
      notifyUsers: jest.fn()
    };

    manager = {} as EntityManager;

    transactionMock = jest
      .fn()
      .mockImplementation((callback: (entityManager: EntityManager) => Promise<Task>) => callback(manager));

    const dataSource = { transaction: transactionMock } as unknown as DataSource;

    tasksService = new TasksService(
      tasksRepository as unknown as TasksRepository,
      {} as unknown as HivesRepository,
      {} as unknown as UsersService,
      notificationsService as unknown as NotificationsService,
      dataSource
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createTask = (overrides: Partial<Task> = {}): Task => {
    const owner: User = { id: 'owner-1' } as User;
    const members: User[] = [{ id: 'member-1' } as User, { id: 'member-2' } as User];
    const hive: Hive = {
      id: 'hive-1',
      name: 'Hive',
      owner,
      members
    } as Hive;

    const baseTask: Task = {
      id: 'task-1',
      title: 'Task 1',
      status: TaskStatus.PENDING,
      priority: 2,
      hive,
      assignedTo: null,
      createdBy: owner,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as Task;

    Object.assign(baseTask, overrides);
    return baseTask;
  };

  const ownerUser: AuthenticatedUser = {
    userId: 'owner-1',
    email: 'owner@example.com',
    roles: ['keeper']
  };

  it('allows hive owners to update task status', async () => {
    const task = createTask();
    tasksRepository.findById.mockResolvedValue(task);
    tasksRepository.save.mockImplementation(async (entity: Task) => entity);

    const result = await tasksService.updateTaskStatus(ownerUser, task.id, { status: TaskStatus.COMPLETED });

    expect(tasksRepository.findById).toHaveBeenCalledWith(task.id, manager);
    expect(tasksRepository.save).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(TaskStatus.COMPLETED);
    expect(notificationsService.notifyUsers).toHaveBeenCalledWith(
      ['member-1', 'member-2'],
      expect.objectContaining({ metadata: expect.objectContaining({ taskId: task.id, hiveId: 'hive-1' }) })
    );
  });

  it('prevents unauthorized members from changing the status', async () => {
    const task = createTask();
    tasksRepository.findById.mockResolvedValue(task);

    const unauthorizedUser: AuthenticatedUser = {
      userId: 'random-user',
      email: 'random@example.com',
      roles: ['beekeeper']
    };

    await expect(
      tasksService.updateTaskStatus(unauthorizedUser, task.id, { status: TaskStatus.BLOCKED })
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tasksRepository.save).not.toHaveBeenCalled();
    expect(notificationsService.notifyUsers).not.toHaveBeenCalled();
  });
});
