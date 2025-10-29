#!/usr/bin/env node
/**
 * Clear all projects, tasks, and tickets from the database
 * This keeps roles and users but clears all project-related data
 */

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function clearData() {
  try {
    // Get DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.error('   Make sure you have a .env file with DATABASE_URL configured');
      process.exit(1);
    }

    console.log('🔗 Connecting to database...');
    const sql = postgres(databaseUrl);

    console.log('🗑️  Starting data cleanup...\n');

    // Delete in order to respect foreign key constraints
    
    console.log('  → Deleting subtasks...');
    await sql`DELETE FROM subtasks`;
    console.log('    ✓ Subtasks cleared');

    console.log('  → Deleting tasks...');
    await sql`DELETE FROM tasks`;
    console.log('    ✓ Tasks cleared');

    console.log('  → Deleting ticket replies...');
    await sql`DELETE FROM ticket_replies`;
    console.log('    ✓ Ticket replies cleared');

    console.log('  → Deleting ticket attachments...');
    await sql`DELETE FROM ticket_attachments`;
    console.log('    ✓ Ticket attachments cleared');

    console.log('  → Deleting tickets...');
    await sql`DELETE FROM tickets`;
    console.log('    ✓ Tickets cleared');

    console.log('  → Deleting projects...');
    await sql`DELETE FROM projects`;
    console.log('    ✓ Projects cleared');

    console.log('  → Deleting embeddings...');
    await sql`DELETE FROM embeddings`;
    console.log('    ✓ Embeddings cleared');

    console.log('  → Deleting Plaud pending items...');
    try {
      await sql`DELETE FROM plaud_pending`;
      console.log('    ✓ Plaud pending items cleared');
    } catch (error) {
      if (error.code === '42P01') {
        console.log('    ⓘ Plaud pending table does not exist (skipped)');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All project data has been cleared successfully!');
    console.log('   Note: Users and roles were preserved.');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing data:', error);
    process.exit(1);
  }
}

clearData();

