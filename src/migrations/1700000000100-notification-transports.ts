import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationTransports1700000000100 implements MigrationInterface {
  name = 'NotificationTransports1700000000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_subscriptions_user" ON "notification_subscriptions" ("userId")`
    );

    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "deliveryMetadata" jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "deliveryMetadata"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_subscriptions_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_subscriptions"`);
  }
}
