import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { HivesRepository } from '../hives/hives.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/notification.entity';
import { UsersService } from '../users/users.service';
import { CreateMediaItemDto } from './dto/create-media-item.dto';
import { UpdateMediaItemDto } from './dto/update-media-item.dto';
import { MediaItem } from './media-item.entity';
import { MediaRepository } from './media.repository';

@Injectable()
export class MediaService {
  private static readonly CHANNEL_HINTS = [
    NotificationChannel.IN_APP,
    NotificationChannel.EMAIL,
    NotificationChannel.PUSH
  ];

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly hivesRepository: HivesRepository,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource
  ) {}

  async listForHive(user: AuthenticatedUser, hiveId: string): Promise<MediaItem[]> {
    const hive = await this.hivesRepository.findById(hiveId);
    if (!hive) {
      throw new NotFoundException(`Hive ${hiveId} not found`);
    }
    this.ensureHiveAccess(user, hive.owner.id, hive.members.map((member) => member.id));
    return this.mediaRepository.findByHive(hiveId);
  }

  async listForUser(user: AuthenticatedUser): Promise<MediaItem[]> {
    return this.mediaRepository.findByUploader(user.userId);
  }

  async create(user: AuthenticatedUser, dto: CreateMediaItemDto): Promise<MediaItem> {
    const media = await this.dataSource.transaction(async (manager) => {
      const hive = await this.hivesRepository.findById(dto.hiveId, manager);
      if (!hive) {
        throw new NotFoundException(`Hive ${dto.hiveId} not found`);
      }
      this.ensureHiveAccess(user, hive.owner.id, hive.members.map((member) => member.id));

      const uploader = await this.usersService.findByIdOrFail(user.userId, manager);
      const mediaEntity = this.mediaRepository.create(
        {
          hive,
          uploader,
          url: dto.url,
          mimeType: dto.mimeType,
          description: dto.description,
          metadata: dto.metadata ?? null,
          inspectionId: dto.inspectionId,
          taskId: dto.taskId,
          harvestId: dto.harvestId,
          auditEventId: dto.auditEventId,
          capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : undefined
        },
        manager
      );
      return this.mediaRepository.save(mediaEntity, manager);
    });

    const recipients = new Set<string>();
    media.hive.members.forEach((member) => recipients.add(member.id));
    recipients.add(media.hive.owner.id);
    recipients.delete(user.userId);

    if (recipients.size) {
      await this.notificationsService.notifyUsers(Array.from(recipients), {
        title: `New media added to ${media.hive.name}`,
        body: `${user.email} uploaded new media to ${media.hive.name}.`,
        metadata: { mediaId: media.id, hiveId: media.hive.id },
        channels: MediaService.CHANNEL_HINTS
      });
    }

    return media;
  }

  async update(user: AuthenticatedUser, mediaId: string, dto: UpdateMediaItemDto): Promise<MediaItem> {
    const media = await this.dataSource.transaction(async (manager) => {
      const mediaEntity = await this.mediaRepository.findById(mediaId, manager);
      if (!mediaEntity) {
        throw new NotFoundException(`Media item ${mediaId} not found`);
      }
      this.ensureMediaManageAccess(user, mediaEntity);

      if (dto.mimeType !== undefined) {
        mediaEntity.mimeType = dto.mimeType;
      }
      if (dto.description !== undefined) {
        mediaEntity.description = dto.description;
      }
      if (dto.metadata !== undefined) {
        mediaEntity.metadata = dto.metadata;
      }

      if (dto.inspectionId !== undefined) {
        mediaEntity.inspectionId = dto.inspectionId || undefined;
      }

      if (dto.taskId !== undefined) {
        mediaEntity.taskId = dto.taskId || undefined;
      }

      if (dto.harvestId !== undefined) {
        mediaEntity.harvestId = dto.harvestId || undefined;
      }

      if (dto.auditEventId !== undefined) {
        mediaEntity.auditEventId = dto.auditEventId || undefined;
      }

      if (dto.capturedAt !== undefined) {
        mediaEntity.capturedAt = dto.capturedAt ? new Date(dto.capturedAt) : undefined;
      }

      return this.mediaRepository.save(mediaEntity, manager);
    });

    return media;
  }

  async remove(user: AuthenticatedUser, mediaId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const media = await this.mediaRepository.findById(mediaId, manager);
      if (!media) {
        throw new NotFoundException(`Media item ${mediaId} not found`);
      }
      this.ensureMediaManageAccess(user, media);
      await this.mediaRepository.remove(media, manager);
    });
  }

  private ensureHiveAccess(user: AuthenticatedUser, ownerId: string, memberIds: string[]) {
    const isMember = ownerId === user.userId || memberIds.includes(user.userId);
    const isAdmin = user.roles.includes('admin');
    if (!isMember && !isAdmin) {
      throw new ForbiddenException('You do not have access to this hive');
    }
  }

  private ensureMediaManageAccess(user: AuthenticatedUser, media: MediaItem) {
    const ownerId = media.hive.owner.id;
    const memberIds = media.hive.members?.map((member) => member.id) || [];
    const isUploader = media.uploader.id === user.userId;
    const hasRole = user.roles.includes('admin') || user.roles.includes('manager');
    const isOwner = ownerId === user.userId;

    if (isUploader || hasRole || isOwner) {
      return;
    }

    const isMember = memberIds.includes(user.userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have permission to modify this media item');
    }

    throw new ForbiddenException('You do not have permission to modify this media item');
  }
}
