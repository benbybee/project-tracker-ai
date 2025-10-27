#!/usr/bin/env node
/**
 * Run analytics tables migration
 * This script reads and executes the analytics migration SQL file
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

async function runMigration() {
  console.log('🔄 Running analytics tables migration...\n');

  // Read DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    // Read migration file
    const migrationPath = join(
      __dirname,
      '..',
      'src',
      'server',
      'db',
      'migrations',
      '0007_add_analytics_tables.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    // Execute the entire migration as one transaction
    await sql.unsafe(migrationSQL);
    console.log('✓ All statements executed successfully');

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Created tables:');
    console.log('  - task_analytics');
    console.log('  - user_patterns');
    console.log('  - ai_suggestions');
    console.log('\nCreated indexes for optimal query performance');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log(
        '\n⚠️  Tables already exist. This is okay - skipping migration.'
      );
      process.exit(0);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration().catch(console.error);
