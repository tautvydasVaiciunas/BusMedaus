import { PrismaClient, HiveStatus, TaskStatus, TaskStepStatus, NotificationChannel, NotificationStatus, InspectionTaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BusMedaus data...');

  const [adminRole, inspectorRole, beekeeperRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Platform administrator with full access.' }
    }),
    prisma.role.upsert({
      where: { name: 'inspector' },
      update: {},
      create: { name: 'inspector', description: 'Performs and records hive inspections.' }
    }),
    prisma.role.upsert({
      where: { name: 'beekeeper' },
      update: {},
      create: { name: 'beekeeper', description: 'Manages day-to-day hive health.' }
    })
  ]);

  const [ava, liam, sofia] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ava@busmedaus.test' },
      update: {},
      create: {
        email: 'ava@busmedaus.test',
        firstName: 'Ava',
        lastName: 'Nguyen',
        phoneNumber: '+61-400-000-001'
      }
    }),
    prisma.user.upsert({
      where: { email: 'liam@busmedaus.test' },
      update: {},
      create: {
        email: 'liam@busmedaus.test',
        firstName: 'Liam',
        lastName: 'Patel',
        phoneNumber: '+61-400-000-002'
      }
    }),
    prisma.user.upsert({
      where: { email: 'sofia@busmedaus.test' },
      update: {},
      create: {
        email: 'sofia@busmedaus.test',
        firstName: 'Sofia',
        lastName: 'Martinez',
        phoneNumber: '+61-400-000-003'
      }
    })
  ]);

  await Promise.all([
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: ava.id, roleId: adminRole.id } },
      update: {},
      create: { userId: ava.id, roleId: adminRole.id }
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: liam.id, roleId: inspectorRole.id } },
      update: {},
      create: { userId: liam.id, roleId: inspectorRole.id }
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: sofia.id, roleId: beekeeperRole.id } },
      update: {},
      create: { userId: sofia.id, roleId: beekeeperRole.id }
    })
  ]);

  const operationsGroup = await prisma.group.upsert({
    where: { name: 'Melbourne Field Crew' },
    update: {},
    create: { name: 'Melbourne Field Crew', description: 'Primary crew for metropolitan apiaries.' }
  });

  await Promise.all([
    prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId: operationsGroup.id, userId: ava.id } },
      update: {},
      create: { groupId: operationsGroup.id, userId: ava.id, role: 'Coordinator' }
    }),
    prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId: operationsGroup.id, userId: liam.id } },
      update: {},
      create: { groupId: operationsGroup.id, userId: liam.id, role: 'Inspector' }
    }),
    prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId: operationsGroup.id, userId: sofia.id } },
      update: {},
      create: { groupId: operationsGroup.id, userId: sofia.id, role: 'Beekeeper' }
    })
  ]);

  const springChecklist = await prisma.taskTemplate.upsert({
    where: { id: 'spring-checklist-template' },
    update: { name: 'Spring Health Checklist' },
    create: {
      id: 'spring-checklist-template',
      name: 'Spring Health Checklist',
      description: 'Seasonal inspection checklist for post-winter recovery.',
      category: 'Seasonal',
      createdById: ava.id
    }
  });

  const templateStepData = [
    { sequence: 1, title: 'Assess brood pattern', description: 'Confirm even brood distribution and queen performance.' },
    { sequence: 2, title: 'Check food stores', description: 'Estimate honey and pollen reserves in outer frames.' },
    { sequence: 3, title: 'Inspect for pests', description: 'Look for signs of varroa, beetles, or disease.' }
  ];

  for (const step of templateStepData) {
    await prisma.taskTemplateStep.upsert({
      where: { taskTemplateId_sequence: { taskTemplateId: springChecklist.id, sequence: step.sequence } },
      update: step,
      create: {
        taskTemplateId: springChecklist.id,
        ...step
      }
    });
  }

  const hiveSunrise = await prisma.hive.upsert({
    where: { id: 'hive-sunrise' },
    update: { status: HiveStatus.ACTIVE },
    create: {
      id: 'hive-sunrise',
      name: 'Sunrise',
      apiaryName: 'Docklands Rooftop',
      location: 'Docklands, Melbourne VIC',
      status: HiveStatus.MONITORED,
      queenStatus: 'Marked 2023 Queen',
      temperament: 'Calm',
      healthScore: 85,
      createdById: ava.id
    }
  });

  const hiveRiver = await prisma.hive.upsert({
    where: { id: 'hive-riverbend' },
    update: { status: HiveStatus.ACTIVE },
    create: {
      id: 'hive-riverbend',
      name: 'Riverbend',
      apiaryName: 'Yarra Community Garden',
      location: 'Abbotsford, Melbourne VIC',
      status: HiveStatus.ACTIVE,
      queenStatus: 'Unmarked Queen 2024',
      temperament: 'Energetic',
      healthScore: 90,
      createdById: ava.id
    }
  });

  const inspection = await prisma.inspection.create({
    data: {
      hiveId: hiveSunrise.id,
      inspectorId: liam.id,
      scheduledFor: new Date('2024-09-15T08:30:00Z'),
      completedAt: new Date('2024-09-15T09:10:00Z'),
      overallCondition: 'Strong population with minor cross-comb.',
      queenSighted: true,
      broodPattern: 'Solid with some drone cells on edges.',
      miteDropCount: 2,
      notes: 'Recommend adding super and re-leveling hive stand.'
    }
  });

  const followUpTask = await prisma.task.create({
    data: {
      title: 'Install leveling shims and add honey super',
      description: 'Stabilize hive stand and add one medium super to support nectar flow.',
      status: TaskStatus.IN_PROGRESS,
      priority: 1,
      dueDate: new Date('2024-09-20T00:00:00Z'),
      hiveId: hiveSunrise.id,
      inspectionId: inspection.id,
      templateId: springChecklist.id,
      createdById: ava.id,
      assignedToId: sofia.id
    }
  });

  const inspectionTask = await prisma.inspectionTask.create({
    data: {
      inspectionId: inspection.id,
      taskTemplateId: springChecklist.id,
      taskId: followUpTask.id,
      status: InspectionTaskStatus.IN_PROGRESS,
      notes: 'Checklist generated from spring template; two corrective items captured.'
    }
  });

  let stepIndex = 0;
  for (const templateStep of templateStepData) {
    stepIndex += 1;
    await prisma.taskStep.create({
      data: {
        taskId: followUpTask.id,
        sequence: templateStep.sequence,
        title: templateStep.title,
        description: templateStep.description,
        status: stepIndex === 1 ? TaskStepStatus.COMPLETED : TaskStepStatus.PENDING,
        completedAt: stepIndex === 1 ? new Date('2024-09-16T01:00:00Z') : null,
        notes: stepIndex === 1 ? 'Shimmed north-west corner to level bubble.' : null
      }
    });
  }

  const harvest = await prisma.honeyHarvest.create({
    data: {
      hiveId: hiveRiver.id,
      recordedById: sofia.id,
      harvestDate: new Date('2024-02-12T05:00:00Z'),
      framesHarvested: 8,
      weightKg: 24.6,
      moisturePercent: 17.8,
      notes: 'Filtered and ready for bottling after 48-hour settling.'
    }
  });

  const auditEvent = await prisma.auditEvent.create({
    data: {
      userId: ava.id,
      entityType: 'UserRole',
      entityId: `${sofia.id}:${beekeeperRole.id}`,
      action: 'ASSIGN_ROLE',
      summary: 'Granted beekeeper role to Sofia Martinez.',
      metadata: { approvedBy: 'ava@busmedaus.test' },
      ipAddress: '203.0.113.42',
      userAgent: 'SeedScript/1.0'
    }
  });

  const inspectionPhoto = await prisma.mediaAttachment.create({
    data: {
      url: 'https://cdn.busmedaus.test/inspections/sunrise-20240915.jpg',
      mimeType: 'image/jpeg',
      description: 'Top bar photo showing brood pattern.',
      hiveId: hiveSunrise.id,
      inspectionId: inspection.id,
      uploadedById: liam.id,
      capturedAt: new Date('2024-09-15T08:55:00Z'),
      metadata: { camera: 'iPhone 15 Pro' }
    }
  });

  const harvestClip = await prisma.mediaAttachment.create({
    data: {
      url: 'https://cdn.busmedaus.test/harvests/riverbend-bottling.mp4',
      mimeType: 'video/mp4',
      description: 'Bottling highlights from Riverbend harvest.',
      hiveId: hiveRiver.id,
      harvestId: harvest.id,
      uploadedById: sofia.id,
      metadata: { durationSeconds: 42 }
    }
  });

  const notifications = [
    prisma.notification.create({
      data: {
        userId: sofia.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        title: 'New task: Install leveling shims and add honey super',
        body: 'Ava assigned you a task generated from the spring checklist.',
        relatedTaskId: followUpTask.id,
        relatedInspectionId: inspection.id,
        metadata: { priority: 1 },
        sentAt: new Date('2024-09-15T09:05:00Z')
      }
    }),
    prisma.notification.create({
      data: {
        userId: ava.id,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.SENT,
        title: 'Audit log: Role granted to Sofia Martinez',
        body: 'The beekeeper role was assigned to Sofia Martinez.',
        auditEventId: auditEvent.id,
        sentAt: new Date('2024-09-15T09:06:00Z'),
        metadata: { severity: 'info' }
      }
    })
  ];

  await Promise.all(notifications);

  console.log('Seed data created successfully.');
}

main()
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
