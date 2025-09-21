import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1699999999999 implements MigrationInterface {
  name = 'CreateCoreTables1699999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "firstName" character varying(100) NOT NULL DEFAULT '',
        "lastName" character varying(100) NOT NULL DEFAULT '',
        "phoneNumber" character varying(32),
        "passwordHash" character varying(255) NOT NULL,
        "roles" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hives" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "apiaryName" character varying(150) NOT NULL DEFAULT '',
        "description" text,
        "location" character varying(300),
        "status" text NOT NULL DEFAULT 'ACTIVE',
        "queenStatus" character varying(200),
        "temperament" character varying(200),
        "healthScore" smallint,
        "ownerId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_hives_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hives_owner" ON "hives" ("ownerId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hive_members" (
        "hiveId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_hive_members" PRIMARY KEY ("hiveId", "userId"),
        CONSTRAINT "FK_hive_members_hive" FOREIGN KEY ("hiveId") REFERENCES "hives"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_hive_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hive_members_hive" ON "hive_members" ("hiveId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hive_members_user" ON "hive_members" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" text NOT NULL DEFAULT 'PENDING',
        "priority" integer NOT NULL DEFAULT 2,
        "dueDate" TIMESTAMP,
        "hiveId" uuid NOT NULL,
        "inspectionId" text,
        "templateId" text,
        "createdById" uuid,
        "assignedToId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tasks_hive" FOREIGN KEY ("hiveId") REFERENCES "hives"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tasks_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tasks_assignedTo" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_hive" ON "tasks" ("hiveId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_createdBy" ON "tasks" ("createdById")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tasks_assignedTo" ON "tasks" ("assignedToId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "content" text NOT NULL,
        "taskId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_comments_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_author" FOREIGN KEY ("authorId") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_task" ON "comments" ("taskId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_author" ON "comments" ("authorId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "media_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "url" text NOT NULL,
        "mimeType" character varying(150) NOT NULL,
        "description" text,
        "metadata" jsonb,
        "hiveId" uuid NOT NULL,
        "inspectionId" text,
        "taskId" text,
        "harvestId" text,
        "auditEventId" text,
        "uploaderId" uuid NOT NULL,
        "capturedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_media_items_hive" FOREIGN KEY ("hiveId") REFERENCES "hives"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_media_items_uploader" FOREIGN KEY ("uploaderId") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_media_items_hive" ON "media_items" ("hiveId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_media_items_uploader" ON "media_items" ("uploaderId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "channel" text NOT NULL DEFAULT 'IN_APP',
        "status" text NOT NULL DEFAULT 'PENDING',
        "title" text NOT NULL,
        "body" text NOT NULL,
        "relatedTaskId" text,
        "relatedInspectionId" text,
        "relatedHarvestId" text,
        "auditEventId" text,
        "metadata" jsonb,
        "deliveryMetadata" jsonb,
        "sentAt" TIMESTAMP,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_user" ON "notifications" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "token" character varying(255) NOT NULL,
        "platform" character varying(50) NOT NULL DEFAULT 'web',
        "metadata" jsonb,
        "lastUsedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_notification_subscriptions_token_user" UNIQUE ("token", "userId"),
        CONSTRAINT "FK_notification_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_subscriptions_user" ON "notification_subscriptions" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "tokenId" character varying(255) NOT NULL,
        "tokenHash" text NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_tokens_tokenId" UNIQUE ("tokenId"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_user" ON "refresh_tokens" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "action" character varying(255) NOT NULL,
        "details" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_refresh_tokens_user"');
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notification_subscriptions_user"');
    await queryRunner.query('DROP TABLE IF EXISTS "notification_subscriptions"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_user"');
    await queryRunner.query('DROP TABLE IF EXISTS "notifications"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_media_items_uploader"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_media_items_hive"');
    await queryRunner.query('DROP TABLE IF EXISTS "media_items"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_comments_author"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_comments_task"');
    await queryRunner.query('DROP TABLE IF EXISTS "comments"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_assignedTo"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_createdBy"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_hive"');
    await queryRunner.query('DROP TABLE IF EXISTS "tasks"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_hive_members_user"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_hive_members_hive"');
    await queryRunner.query('DROP TABLE IF EXISTS "hive_members"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_hives_owner"');
    await queryRunner.query('DROP TABLE IF EXISTS "hives"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
