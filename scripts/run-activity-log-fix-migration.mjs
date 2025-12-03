#!/usr/bin/env node

/**
 * Migration Script: Fix Activity Log Foreign Key Constraint
 *
 * This script updates the foreign key constraint on activity_log.task_id
 * to use ON DELETE SET NULL instead of ON DELETE NO ACTION.
 * This allows tasks to be deleted while preserving activity history.
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

async function runMigration() {
  console.log('🔄 Running activity log foreign key constraint fix...\n');

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
      '0020_fix_activity_log_cascade.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration SQL...\n');
    console.log(
      '   - Dropping existing constraint: activity_log_task_id_tasks_id_fk'
    );
    console.log('   - Adding new constraint with ON DELETE SET NULL\n');

    // Execute the entire migration as one transaction
    await sql.unsafe(migrationSQL);
    console.log('✓ Migration executed successfully');

    console.log('\n✅ Migration completed successfully!\n');
    console.log(
      'Tasks can now be deleted without foreign key constraint errors.'
    );
    console.log(
      'Activity log entries will have their task_id set to NULL when a task is deleted.'
    );
    console.log(
      'This preserves the activity history while allowing task cleanup.\n'
    );
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log(
        '\n⚠️  Constraint might already be modified. This is okay - skipping migration.'
      );
      process.exit(0);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration().catch(console.error);
