import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function dropSchema() {
  console.log('Initializing database connection...');
  await AppDataSource.initialize();
  try {
    console.log('Dropping existing schema...');
    const queryRunner = AppDataSource.createQueryRunner();
    try {
      await queryRunner.clearDatabase();
    } finally {
      await queryRunner.release();
    }
    console.log('Schema dropped. Ready to rerun migrations.');
  } finally {
    await AppDataSource.destroy();
  }
}

dropSchema().catch((error) => {
  console.error('Failed to reset database schema', error);
  process.exitCode = 1;
});
