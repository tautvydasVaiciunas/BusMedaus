import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';
import { CommentsRepository } from './comments.repository';
import { TasksRepository } from '../tasks/tasks.repository';

@Injectable()
export class MessagingService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource
  ) {}

  async getCommentsForTask(user: AuthenticatedUser, taskId: string): Promise<Comment[]> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    this.ensureHiveAccess(user, task.hive.id, task.hive.members.map((member) => member.id), task.hive.owner.id);
    return this.commentsRepository.findByTask(taskId);
  }

  async addComment(user: AuthenticatedUser, taskId: string, dto: CreateCommentDto): Promise<Comment> {
    const { comment, recipients } = await this.dataSource.transaction(async (manager) => {
      const task = await this.tasksRepository.findById(taskId, manager);
      if (!task) {
        throw new NotFoundException(`Task ${taskId} not found`);
      }

      this.ensureHiveAccess(
        user,
        task.hive.id,
        task.hive.members.map((member) => member.id),
        task.hive.owner.id
      );

      const author = await this.usersService.findByIdOrFail(user.userId, manager);
      const commentEntity = this.commentsRepository.create(
        {
          content: dto.content,
          task,
          author
        },
        manager
      );
      const saved = await this.commentsRepository.save(commentEntity, manager);

      const recipients = new Set<string>();
      recipients.add(task.hive.owner.id);
      task.hive.members.forEach((member) => recipients.add(member.id));
      if (task.assignedTo) {
        recipients.add(task.assignedTo.id);
      }
      recipients.delete(user.userId);

      return { comment: saved, recipients: Array.from(recipients) };
    });

    if (recipients.length) {
      await this.notificationsService.notifyUsers(recipients, `New comment on task ${comment.task.title}`, {
        taskId: comment.task.id,
        hiveId: comment.task.hive.id,
        commentId: comment.id
      });
    }

    return comment;
  }

  private ensureHiveAccess(
    user: AuthenticatedUser,
    hiveId: string,
    memberIds: string[],
    ownerId: string
  ) {
    const isMember = ownerId === user.userId || memberIds.includes(user.userId);
    const isAdmin = user.roles.includes('admin');
    if (!isMember && !isAdmin) {
      throw new ForbiddenException(`You do not have access to hive ${hiveId}`);
    }
  }
}
