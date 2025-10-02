import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignTypeormSchema1700000000000 implements MigrationInterface {
  name = 'AlignTypeormSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstName" character varying(100) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName" character varying(100) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phoneNumber" TYPE character varying(32)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phoneNumber" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "apiaryName" character varying(150) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "location" character varying(300)`);
    await queryRunner.query(`ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'ACTIVE'`);
    await queryRunner.query(`ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "queenStatus" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "temperament" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "healthScore" smallint`);

    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 2`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "inspectionId" text`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "templateId" text`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "createdById" text`);
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT IF NOT EXISTS "FK_tasks_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL`
    );

    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "message"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "metadata"`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "channel" text NOT NULL DEFAULT 'IN_APP'`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'PENDING'`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "body" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "relatedTaskId" text`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "relatedInspectionId" text`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "relatedHarvestId" text`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "auditEventId" text`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP WITH TIME ZONE`
    );

    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "metadata"`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "mimeType" character varying(150) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "metadata" jsonb`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "inspectionId" text`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "taskId" text`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "harvestId" text`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "auditEventId" text`);
    await queryRunner.query(
      `ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "capturedAt" TIMESTAMP WITH TIME ZONE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "capturedAt"`);
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "auditEventId"`);
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "harvestId"`);
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "taskId"`);
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "inspectionId"`);
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "metadata"`);
    await queryRunner.query(`ALTER TABLE "media_items" DROP COLUMN IF EXISTS "mimeType"`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "metadata" text`);
    await queryRunner.query(`ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "type" character varying(100)`);

    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "readAt"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "sentAt"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "metadata"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "auditEventId"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "relatedHarvestId"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "relatedInspectionId"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "relatedTaskId"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "body"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "title"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "channel"`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" text`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message" text`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read" boolean NOT NULL DEFAULT false`);

    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "createdById"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "templateId"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "inspectionId"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "dueDate"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "priority"`);

    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "healthScore"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "temperament"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "queenStatus"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "location"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "apiaryName"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phoneNumber"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "firstName"`);
  }
}
