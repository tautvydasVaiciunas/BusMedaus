import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>
  ) {}

  private getRepo(manager?: EntityManager): Repository<Comment> {
    return manager ? manager.getRepository(Comment) : this.repository;
  }

  create(data: Partial<Comment>, manager?: EntityManager): Comment {
    return this.getRepo(manager).create(data);
  }

  save(comment: Comment, manager?: EntityManager): Promise<Comment> {
    return this.getRepo(manager).save(comment);
  }

  findByTask(taskId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { task: { id: taskId } },
      relations: ['author'],
      order: { createdAt: 'ASC' }
    });
  }

  findRecentForAccessibleTasks(userId: string, includeAll = false): Promise<Comment[]> {
    const query = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.task', 'task')
      .leftJoinAndSelect('task.hive', 'hive')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoin('hive.owner', 'owner')
      .leftJoin('hive.members', 'member')
      .orderBy('comment.createdAt', 'DESC')
      .distinct(true)
      .limit(50);

    if (!includeAll) {
      query.where(
        new Brackets((qb) => {
          qb.where('owner.id = :userId', { userId })
            .orWhere('member.id = :userId', { userId })
            .orWhere('assignedTo.id = :userId', { userId })
            .orWhere('createdBy.id = :userId', { userId })
            .orWhere('author.id = :userId', { userId });
        })
      );
    }

    return query.getMany();
  }
}
