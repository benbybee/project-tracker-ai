#!/usr/bin/env node
/**
 * COMPLETE DATABASE RESET
 * 
 * This script deletes ALL data from ALL tables in the database.
 * Use this to start completely fresh with a clean slate.
 * 
 * WARNING: This is irreversible! All users, projects, tasks, notes, 
 * tickets, chat history, analytics - everything will be deleted.
 */

import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function resetDatabase() {
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

    console.log('\n⚠️  WARNING: This will DELETE ALL DATA from the database!');
    console.log('   All users, projects, tasks, notes, tickets, chat, analytics, etc.');
    console.log('   This operation is IRREVERSIBLE!\n');

    console.log('🗑️  Starting COMPLETE database reset...\n');

    // Delete in order to respect foreign key constraints
    // Start with most dependent tables and work back to core tables

    console.log('📊 Deleting Analytics & AI Data...');
    
    console.log('  → Deleting AI suggestions...');
    await sql`DELETE FROM ai_suggestions`;
    console.log('    ✓ AI suggestions cleared');

    console.log('  → Deleting task analytics...');
    await sql`DELETE FROM task_analytics`;
    console.log('    ✓ Task analytics cleared');

    console.log('  → Deleting user patterns...');
    await sql`DELETE FROM user_patterns`;
    console.log('    ✓ User patterns cleared');

    console.log('\n💬 Deleting Chat & Collaboration Data...');

    console.log('  → Deleting message reactions...');
    await sql`DELETE FROM message_reactions`;
    console.log('    ✓ Message reactions cleared');

    console.log('  → Deleting messages...');
    await sql`DELETE FROM messages`;
    console.log('    ✓ Messages cleared');

    console.log('  → Deleting thread participants...');
    await sql`DELETE FROM thread_participants`;
    console.log('    ✓ Thread participants cleared');

    console.log('  → Deleting threads...');
    await sql`DELETE FROM threads`;
    console.log('    ✓ Threads cleared');

    console.log('\n📢 Deleting Notifications & Activity...');

    console.log('  → Deleting notifications...');
    await sql`DELETE FROM notifications`;
    console.log('    ✓ Notifications cleared');

    console.log('  → Deleting activity log...');
    await sql`DELETE FROM activity_log`;
    console.log('    ✓ Activity log cleared');

    console.log('\n📝 Deleting Notes...');

    console.log('  → Deleting notes...');
    await sql`DELETE FROM notes`;
    console.log('    ✓ Notes cleared');

    console.log('\n🎫 Deleting Tickets...');

    console.log('  → Deleting ticket replies...');
    await sql`DELETE FROM ticket_replies`;
    console.log('    ✓ Ticket replies cleared');

    console.log('  → Deleting ticket attachments...');
    await sql`DELETE FROM ticket_attachments`;
    console.log('    ✓ Ticket attachments cleared');

    console.log('  → Deleting tickets...');
    await sql`DELETE FROM tickets`;
    console.log('    ✓ Tickets cleared');

    console.log('\n✅ Deleting Tasks...');

    console.log('  → Deleting subtasks...');
    await sql`DELETE FROM subtasks`;
    console.log('    ✓ Subtasks cleared');

    console.log('  → Deleting tasks...');
    await sql`DELETE FROM tasks`;
    console.log('    ✓ Tasks cleared');

    console.log('\n📁 Deleting Projects...');

    console.log('  → Deleting projects...');
    await sql`DELETE FROM projects`;
    console.log('    ✓ Projects cleared');

    console.log('\n🏷️  Deleting Roles...');

    console.log('  → Deleting roles...');
    await sql`DELETE FROM roles`;
    console.log('    ✓ Roles cleared');

    console.log('\n🔍 Deleting Search Data...');

    console.log('  → Deleting embeddings...');
    await sql`DELETE FROM embeddings`;
    console.log('    ✓ Embeddings cleared');

    console.log('\n🎙️  Deleting Plaud Data...');

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

    console.log('\n👥 Deleting Users...');

    console.log('  → Deleting ALL users...');
    await sql`DELETE FROM users`;
    console.log('    ✓ ALL users cleared');

    console.log('\n✨ SUCCESS! Database has been completely reset.');
    console.log('\n📊 Summary:');
    console.log('   • All users deleted');
    console.log('   • All roles deleted');
    console.log('   • All projects deleted');
    console.log('   • All tasks deleted');
    console.log('   • All notes deleted');
    console.log('   • All tickets deleted');
    console.log('   • All chat history deleted');
    console.log('   • All analytics deleted');
    console.log('   • All notifications deleted');
    console.log('   • All activity logs deleted');
    console.log('   • All embeddings deleted');
    console.log('\n🎯 You can now create a fresh user account and start from scratch!');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    console.error('   Error details:', error.message);
    process.exit(1);
  }
}

resetDatabase();

