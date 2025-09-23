import { ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { MessagingService } from '../messaging.service';
import { CommentsRepository } from '../comments.repository';
import { TasksRepository } from '../../tasks/tasks.repository';
import { UsersService } from '../../users/users.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { Task } from '../../tasks/task.entity';
import { Hive } from '../../hives/hive.entity';
import { User } from '../../users/user.entity';

const createUser = (id: string): User => ({
  id
} as User);

describe('MessagingService - addComment', () => {
  let service: MessagingService;
  let commentsRepository: jest.Mocked<CommentsRepository>;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let usersService: jest.Mocked<UsersService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(() => {
    commentsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findByTask: jest.fn(),
      findRecentForAccessibleTasks: jest.fn()
    } as unknown as jest.Mocked<CommentsRepository>;

    tasksRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
      findByHive: jest.fn(),
      findAllWithRelations: jest.fn(),
      findAccessible: jest.fn()
    } as unknown as jest.Mocked<TasksRepository>;

    usersService = {
      findByIdOrFail: jest.fn()
    } as unknown as jest.Mocked<UsersService>;

    notificationsService = {
      notifyUsers: jest.fn()
    } as unknown as jest.Mocked<NotificationsService>;

    dataSource = {
      transaction: jest.fn()
    };

    service = new MessagingService(
      commentsRepository,
      tasksRepository,
      usersService,
      notificationsService,
      dataSource as unknown as DataSource
    );
  });

  it('throws when a user outside the hive attempts to comment', async () => {
    const hive: Hive = {
      id: 'hive-1',
      name: 'Test Hive',
      owner: createUser('owner-1'),
      members: [createUser('member-1')]
    } as Hive;

    const task: Task = {
      id: 'task-1',
      title: 'Inspect ventilation',
      hive,
      assignedTo: null
    } as Task;

    const manager = {} as EntityManager;
    (tasksRepository.findById as jest.Mock).mockResolvedValue(task);
    dataSource.transaction.mockImplementation(async (run) => run(manager));

    const user: AuthenticatedUser = {
      userId: 'intruder-1',
      email: 'intruder@example.com',
      roles: []
    };

    await expect(service.addComment(user, 'task-1', { content: 'Sveiki' }))
      .rejects.toBeInstanceOf(ForbiddenException);

    expect(tasksRepository.findById).toHaveBeenCalledWith('task-1', manager);
    expect(usersService.findByIdOrFail).not.toHaveBeenCalled();
    expect(commentsRepository.save).not.toHaveBeenCalled();
    expect(notificationsService.notifyUsers).not.toHaveBeenCalled();
  });
});
