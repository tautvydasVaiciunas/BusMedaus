import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHiveTelemetry1700000000201 implements MigrationInterface {
  name = 'AddHiveTelemetry1700000000201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "productivityIndex" numeric(10,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "lastInspectionAt" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "temperature" double precision`
    );
    await queryRunner.query(
      `ALTER TABLE "hives" ADD COLUMN IF NOT EXISTS "humidity" double precision`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "humidity"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "temperature"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "lastInspectionAt"`);
    await queryRunner.query(`ALTER TABLE "hives" DROP COLUMN IF EXISTS "productivityIndex"`);
  }
}
