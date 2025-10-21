import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Handle missing DATABASE_URL gracefully for UI-only version
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

// Create the connection
const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });

export * from './schema';
