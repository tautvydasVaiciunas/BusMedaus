import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { MediaItem } from './media-item.entity';

@Injectable()
export class MediaRepository {
  constructor(
    @InjectRepository(MediaItem)
    private readonly repository: Repository<MediaItem>
  ) {}

  private getRepo(manager?: EntityManager): Repository<MediaItem> {
    return manager ? manager.getRepository(MediaItem) : this.repository;
  }

  create(data: Partial<MediaItem>, manager?: EntityManager): MediaItem {
    return this.getRepo(manager).create(data);
  }

  save(item: MediaItem, manager?: EntityManager): Promise<MediaItem> {
    return this.getRepo(manager).save(item);
  }

  findById(id: string, manager?: EntityManager): Promise<MediaItem | null> {
    return this.getRepo(manager).findOne({
      where: { id },
      relations: ['hive', 'hive.members', 'hive.owner', 'uploader']
    });
  }

  findByHive(hiveId: string): Promise<MediaItem[]> {
    return this.repository.find({
      where: { hive: { id: hiveId } },
      relations: ['hive', 'uploader'],
      order: { createdAt: 'DESC' }
    });
  }

  findByUploader(uploaderId: string): Promise<MediaItem[]> {
    return this.repository.find({
      where: { uploader: { id: uploaderId } },
      relations: ['hive', 'uploader'],
      order: { createdAt: 'DESC' }
    });
  }

  findAllWithRelations(): Promise<MediaItem[]> {
    return this.repository.find({
      relations: ['hive', 'hive.owner', 'hive.members', 'uploader'],
      order: { createdAt: 'DESC' }
    });
  }

  findAccessible(userId: string): Promise<MediaItem[]> {
    return this.repository
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.hive', 'hive')
      .leftJoinAndSelect('media.uploader', 'uploader')
      .leftJoinAndSelect('hive.owner', 'owner')
      .leftJoinAndSelect('hive.members', 'member')
      .where(
        new Brackets((qb) => {
          qb.where('owner.id = :userId', { userId })
            .orWhere('member.id = :userId', { userId })
            .orWhere('uploader.id = :userId', { userId });
        })
      )
      .orderBy('media.createdAt', 'DESC')
      .distinct(true)
      .getMany();
  }

  async remove(item: MediaItem, manager?: EntityManager): Promise<MediaItem> {
    return this.getRepo(manager).remove(item);
  }
}
