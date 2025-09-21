import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function runMigrations() {
  await AppDataSource.initialize();
  try {
    await AppDataSource.runMigrations();
    console.log('Database migrations executed successfully.');
  } finally {
    await AppDataSource.destroy();
  }
}

runMigrations().catch((error) => {
  console.error('Failed to run migrations', error);
  process.exitCode = 1;
});
