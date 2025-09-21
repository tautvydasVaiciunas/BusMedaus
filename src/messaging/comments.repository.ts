import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
}
