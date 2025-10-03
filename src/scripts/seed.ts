import 'reflect-metadata';
import { AppDataSource } from '../database/data-source';
import { User } from '../users/user.entity';
import { Hive, HiveStatus } from '../hives/hive.entity';
import { Task } from '../tasks/task.entity';
import { TaskStatus } from '../tasks/task-status.enum';
import {
  Notification,
  NotificationChannel,
  NotificationStatus
} from '../notifications/notification.entity';
import { MediaItem } from '../media/media-item.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  try {
    const userRepo = AppDataSource.getRepository(User);
    const ensurePasswordHash = async (password: string, currentHash?: string) => {
      if (!currentHash) {
        return bcrypt.hash(password, 12);
      }
      const matches = await bcrypt.compare(password, currentHash);
      return matches ? currentHash : bcrypt.hash(password, 12);
    };

    let admin = await userRepo.findOne({ where: { email: 'admin@busmedaus.test' } });
    if (!admin) {
      admin = userRepo.create({
        email: 'admin@busmedaus.test',
        firstName: 'Ava',
        lastName: 'Nguyen',
        phoneNumber: '+61-400-000-001',
        roles: ['admin'],
        isActive: true,
        passwordHash: ''
      });
    }

    admin.firstName = 'Ava';
    admin.lastName = 'Nguyen';
    admin.phoneNumber = '+61-400-000-001';
    admin.roles = Array.from(new Set([...(admin.roles ?? []), 'admin']));
    admin.isActive = true;
    admin.passwordHash = await ensurePasswordHash('Admin123!', admin.passwordHash);
    admin = await userRepo.save(admin);

    let member = await userRepo.findOne({ where: { email: 'user@busmedaus.test' } });
    if (!member) {
      member = userRepo.create({
        email: 'user@busmedaus.test',
        firstName: 'Blake',
        lastName: 'Jordan',
        phoneNumber: '+61-400-000-002',
        roles: ['member'],
        isActive: true,
        passwordHash: ''
      });
    }

    member.firstName = 'Blake';
    member.lastName = 'Jordan';
    member.phoneNumber = '+61-400-000-002';
    const existingMemberRoles = member.roles?.length ? member.roles : ['member'];
    member.roles = Array.from(new Set([...existingMemberRoles, 'member']));
    member.isActive = true;
    member.passwordHash = await ensurePasswordHash('User123!', member.passwordHash);
    member = await userRepo.save(member);

    let operator = await userRepo.findOne({ where: { email: 'liam@busmedaus.test' } });
    if (!operator) {
      operator = userRepo.create({
        email: 'liam@busmedaus.test',
        firstName: 'Liam',
        lastName: 'Wong',
        phoneNumber: '+61-400-000-003',
        roles: ['operator'],
        isActive: true,
        passwordHash: ''
      });
    }

    operator.firstName = 'Liam';
    operator.lastName = 'Wong';
    operator.phoneNumber = '+61-400-000-003';
    const existingOperatorRoles = operator.roles?.length ? operator.roles : ['operator'];
    operator.roles = Array.from(new Set([...existingOperatorRoles, 'operator']));
    operator.isActive = true;
    operator.passwordHash = await ensurePasswordHash('Operator123!', operator.passwordHash);
    operator = await userRepo.save(operator);

    const hiveRepo = AppDataSource.getRepository(Hive);
    let hive = await hiveRepo.findOne({ where: { name: 'Sunrise' }, relations: ['members', 'owner'] });
    if (!hive) {
      hive = hiveRepo.create({
        name: 'Sunrise',
        apiaryName: 'Docklands Rooftop',
        description: 'Primary crew hive',
        location: 'Docklands, Melbourne VIC',
        status: HiveStatus.MONITORED,
        queenStatus: 'Marked 2023 Queen',
        temperament: 'Calm',
        healthScore: 85,
        owner: admin,
        members: [admin, member, operator]
      });
      hive = await hiveRepo.save(hive);
    } else {
      hive.owner = admin;
      hive.members = hive.members ?? [];
      const memberIds = new Set(hive.members.map((user) => user.id));
      if (!memberIds.has(admin.id)) {
        hive.members.push(admin);
      }
      if (!memberIds.has(member.id)) {
        hive.members.push(member);
      }
      if (!memberIds.has(operator.id)) {
        hive.members.push(operator);
      }
      hive = await hiveRepo.save(hive);
    }

    const taskRepo = AppDataSource.getRepository(Task);
    let task = await taskRepo.findOne({ where: { title: 'Install leveling shims' }, relations: ['hive', 'createdBy'] });
    if (!task) {
      task = taskRepo.create({
        title: 'Install leveling shims',
        description: 'Stabilize hive stand and add honey super.',
        status: TaskStatus.IN_PROGRESS,
        priority: 1,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        hive,
        createdBy: admin,
        assignedTo: admin
      });
      task = await taskRepo.save(task);
    }

    const notificationRepo = AppDataSource.getRepository(Notification);
    const existingNotification = await notificationRepo.findOne({ where: { title: 'Seed task assignment notice' } });
    if (!existingNotification) {
      const notification = notificationRepo.create({
        user: admin,
        title: 'Seed task assignment notice',
        body: 'You have been assigned to Install leveling shims.',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        relatedTaskId: task.id,
        metadata: { priority: task.priority, channels: [NotificationChannel.IN_APP] },
        deliveryMetadata: {
          [NotificationChannel.IN_APP]: {
            status: NotificationStatus.SENT,
            attempts: 1,
            lastAttemptAt: new Date().toISOString()
          }
        },
        sentAt: new Date()
      });
      await notificationRepo.save(notification);
    }

    const mediaRepo = AppDataSource.getRepository(MediaItem);
    const existingMedia = await mediaRepo.findOne({ where: { url: 'https://cdn.busmedaus.test/hives/sunrise.jpg' } });
    if (!existingMedia) {
      const media = mediaRepo.create({
        hive,
        uploader: admin,
        url: 'https://cdn.busmedaus.test/hives/sunrise.jpg',
        mimeType: 'image/jpeg',
        description: 'Top bar photo showing brood pattern.',
        metadata: { camera: 'SeedScript/1.0' },
        capturedAt: new Date()
      });
      await mediaRepo.save(media);
    }

    console.log('Database seeding complete.');
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Failed to seed database', error);
  process.exitCode = 1;
});
