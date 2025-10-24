#!/usr/bin/env node

/**
 * Quick seed script for initial user data
 * Usage: node scripts/seed-user.mjs
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { users, roles } from '../src/server/db/schema.ts';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function seedUser() {
  try {
    console.log('🌱 Starting user seed...');

    // Create default roles
    const defaultRoles = [
      { name: 'Developer', color: '#3B82F6' },
      { name: 'Designer', color: '#8B5CF6' },
      { name: 'Product Manager', color: '#10B981' },
      { name: 'QA', color: '#F59E0B' },
    ];

    console.log('📝 Creating default roles...');
    for (const role of defaultRoles) {
      await db.insert(roles).values(role).onConflictDoNothing();
    }

    // Create test user
    const testUser = {
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
    };

    console.log('👤 Creating test user...');
    const [user] = await db.insert(users).values(testUser).returning();
    
    console.log('✅ Seed completed successfully!');
    console.log(`📧 Test user: ${user.email}`);
    console.log('🔑 Password: password123');
    console.log('🔗 Login at: http://localhost:3000/sign-in');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedUser();
