#!/usr/bin/env node
const { spawn } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function recreateDatabase() {
  const {
    DB_HOST = 'localhost',
    DB_PORT = '5432',
    DB_USERNAME,
    DB_USER,
    DB_PASSWORD = 'postgres',
    DB_NAME = 'busmedaus',
    DB_ADMIN_DATABASE
  } = process.env;

  const adminDatabase = DB_ADMIN_DATABASE || 'postgres';
  const user = DB_USERNAME || DB_USER || 'postgres';
  const client = new Client({
    host: DB_HOST,
    port: Number(DB_PORT),
    user,
    password: DB_PASSWORD,
    database: adminDatabase
  });

  const safeDbName = DB_NAME.replace(/"/g, '""');

  await client.connect();
  try {
    console.log(`Dropping database ${DB_NAME}...`);
    await client.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [DB_NAME]
    );
    await client.query(`DROP DATABASE IF EXISTS "${safeDbName}"`);
    console.log(`Creating database ${DB_NAME}...`);
    await client.query(`CREATE DATABASE "${safeDbName}"`);
  } finally {
    await client.end();
  }
}

async function main() {
  await recreateDatabase();
  await run(npmCmd, ['run', 'db:migrate']);

  const seedPath = path.resolve(__dirname, '..', 'dist', 'scripts', 'seed.js');
  if (fs.existsSync(seedPath)) {
    await run(npmCmd, ['run', 'db:seed']);
  } else {
    console.warn(`Seed script not found at ${seedPath}. Skipping seeding step.`);
  }
}

main().catch((error) => {
  console.error('Database reset failed:', error);
  process.exitCode = 1;
});
