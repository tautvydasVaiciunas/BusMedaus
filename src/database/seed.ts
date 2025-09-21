import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from '../users/user.entity';
import { Hive, HiveStatus } from '../hives/hive.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Notification, NotificationChannel, NotificationStatus } from '../notifications/notification.entity';
import { MediaItem } from '../media/media-item.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  try {
    const userRepo = AppDataSource.getRepository(User);
    let admin = await userRepo.findOne({ where: { email: 'admin@busmedaus.test' } });
    if (!admin) {
      admin = userRepo.create({
        email: 'admin@busmedaus.test',
        firstName: 'Ava',
        lastName: 'Nguyen',
        phoneNumber: '+61-400-000-001',
        passwordHash: await bcrypt.hash('ChangeMe123!', 12),
        roles: ['admin'],
        isActive: true
      });
      admin = await userRepo.save(admin);
    }

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
        members: [admin]
      });
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
        metadata: { priority: task.priority },
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
