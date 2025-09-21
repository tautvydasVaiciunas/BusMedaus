import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/notification.entity';
import { UsersService } from '../users/users.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { ManageHiveMemberDto } from './dto/manage-hive-member.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { Hive, HiveStatus } from './hive.entity';
import { HivesRepository } from './hives.repository';

@Injectable()
export class HivesService {
  private static readonly CHANNEL_HINTS = [
    NotificationChannel.IN_APP,
    NotificationChannel.EMAIL,
    NotificationChannel.PUSH
  ];

  constructor(
    private readonly hivesRepository: HivesRepository,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource
  ) {}

  async listHivesForUser(user: AuthenticatedUser): Promise<Hive[]> {
    if (user.roles.includes('admin')) {
      return this.hivesRepository.findAll();
    }

    return this.hivesRepository.findAllForUser(user.userId);
  }

  async getHiveForUser(user: AuthenticatedUser, hiveId: string): Promise<Hive> {
    const hive = await this.hivesRepository.findById(hiveId);
    if (!hive) {
      throw new NotFoundException(`Hive ${hiveId} not found`);
    }

    const isMember = hive.owner.id === user.userId || hive.members.some((member) => member.id === user.userId);
    if (!isMember && !user.roles.includes('admin')) {
      throw new ForbiddenException('Access denied');
    }

    return hive;
  }

  async createHive(user: AuthenticatedUser, dto: CreateHiveDto): Promise<Hive> {
    const hive = await this.dataSource.transaction(async (manager) => {
      const owner = await this.usersService.findByIdOrFail(user.userId, manager);
      const memberEntities = [];
      if (dto.memberIds) {
        for (const memberId of dto.memberIds) {
          const member = await this.usersService.findByIdOrFail(memberId, manager);
          memberEntities.push(member);
        }
      }

      const uniqueMembers = new Map<string, typeof owner>();
      [owner, ...memberEntities].forEach((member) => {
        uniqueMembers.set(member.id, member);
      });

      const hiveEntity = this.hivesRepository.create(
        {
          name: dto.name,
          apiaryName: dto.apiaryName ?? dto.name,
          description: dto.description,
          location: dto.location,
          status: dto.status ?? HiveStatus.ACTIVE,
          queenStatus: dto.queenStatus,
          temperament: dto.temperament,
          healthScore: dto.healthScore,
          owner,
          members: Array.from(uniqueMembers.values())
        },
        manager
      );

      return this.hivesRepository.save(hiveEntity, manager);
    });

    const memberIds = hive.members.filter((member) => member.id !== user.userId).map((member) => member.id);
    if (memberIds.length) {
      await this.notificationsService.notifyUsers(memberIds, {
        title: `You were added to hive ${hive.name}`,
        body: `${user.email} added you to hive ${hive.name}.`,
        metadata: { hiveId: hive.id },
        channels: HivesService.CHANNEL_HINTS
      });
    }

    return hive;
  }

  async updateHive(user: AuthenticatedUser, hiveId: string, dto: UpdateHiveDto): Promise<Hive> {
    const hive = await this.dataSource.transaction(async (manager) => {
      const hiveEntity = await this.hivesRepository.findById(hiveId, manager);
      if (!hiveEntity) {
        throw new NotFoundException(`Hive ${hiveId} not found`);
      }

      this.ensureCanModify(user, hiveEntity);

      if (dto.name) {
        hiveEntity.name = dto.name;
      }
      if (dto.apiaryName !== undefined) {
        hiveEntity.apiaryName = dto.apiaryName;
      }
      if (dto.description !== undefined) {
        hiveEntity.description = dto.description;
      }
      if (dto.location !== undefined) {
        hiveEntity.location = dto.location;
      }
      if (dto.status !== undefined) {
        hiveEntity.status = dto.status;
      }
      if (dto.queenStatus !== undefined) {
        hiveEntity.queenStatus = dto.queenStatus;
      }
      if (dto.temperament !== undefined) {
        hiveEntity.temperament = dto.temperament;
      }
      if (dto.healthScore !== undefined) {
        hiveEntity.healthScore = dto.healthScore;
      }
      if (dto.memberIds) {
        const members = [];
        for (const memberId of dto.memberIds) {
          const member = await this.usersService.findByIdOrFail(memberId, manager);
          members.push(member);
        }
        const map = new Map<string, typeof members[number]>();
        [hiveEntity.owner, ...members].forEach((member) => map.set(member.id, member));
        hiveEntity.members = Array.from(map.values());
      }

      return this.hivesRepository.save(hiveEntity, manager);
    });

    await this.notificationsService.notifyUsers(
      hive.members.map((member) => member.id),
      {
        title: `Hive ${hive.name} was updated`,
        body: `Hive ${hive.name} details were updated.`,
        metadata: { hiveId: hive.id },
        channels: HivesService.CHANNEL_HINTS
      }
    );

    return hive;
  }

  async removeHive(user: AuthenticatedUser, hiveId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const hive = await this.hivesRepository.findById(hiveId, manager);
      if (!hive) {
        throw new NotFoundException(`Hive ${hiveId} not found`);
      }
      this.ensureCanModify(user, hive);
      await this.hivesRepository.remove(hive, manager);
    });
  }

  async addMember(user: AuthenticatedUser, hiveId: string, dto: ManageHiveMemberDto): Promise<Hive> {
    const hive = await this.dataSource.transaction(async (manager) => {
      const hiveEntity = await this.hivesRepository.findById(hiveId, manager);
      if (!hiveEntity) {
        throw new NotFoundException(`Hive ${hiveId} not found`);
      }
      this.ensureCanModify(user, hiveEntity);

      const member = await this.usersService.findByIdOrFail(dto.userId, manager);
      if (!hiveEntity.members.some((m) => m.id === member.id)) {
        hiveEntity.members = [...hiveEntity.members, member];
      }

      return this.hivesRepository.save(hiveEntity, manager);
    });

    await this.notificationsService.notifyUsers([dto.userId], {
      title: `You were added to hive ${hive.name}`,
      body: `${user.email} added you to hive ${hive.name}.`,
      metadata: { hiveId: hive.id },
      channels: HivesService.CHANNEL_HINTS
    });

    return hive;
  }

  async removeMember(user: AuthenticatedUser, hiveId: string, memberId: string): Promise<Hive> {
    const hive = await this.dataSource.transaction(async (manager) => {
      const hiveEntity = await this.hivesRepository.findById(hiveId, manager);
      if (!hiveEntity) {
        throw new NotFoundException(`Hive ${hiveId} not found`);
      }
      this.ensureCanModify(user, hiveEntity);

      hiveEntity.members = hiveEntity.members.filter((member) => member.id !== memberId);
      if (hiveEntity.owner.id === memberId) {
        throw new ForbiddenException('Owner cannot be removed from hive');
      }

      return this.hivesRepository.save(hiveEntity, manager);
    });

    await this.notificationsService.notifyUsers([memberId], {
      title: `You were removed from hive ${hive.name}`,
      body: `${user.email} removed you from hive ${hive.name}.`,
      metadata: { hiveId: hive.id },
      channels: HivesService.CHANNEL_HINTS
    });

    return hive;
  }

  private ensureCanModify(user: AuthenticatedUser, hive: Hive) {
    const isOwner = hive.owner.id === user.userId;
    const hasManagementRole = user.roles.includes('admin') || user.roles.includes('manager');
    if (!isOwner && !hasManagementRole) {
      throw new ForbiddenException('Insufficient permissions to modify hive');
    }
  }
}
