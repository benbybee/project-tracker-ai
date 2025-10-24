import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Test if tickets table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets'
      );
    `);
    
    const tablesExist = result.rows[0]?.exists || false;
    
    if (!tablesExist) {
      return NextResponse.json({
        ok: false,
        error: 'Tickets table does not exist',
        message: 'Run: npx drizzle-kit push:pg or apply migration 0004',
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Database tables exist and are ready',
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || 'Database connection failed',
      hint: 'Check DATABASE_URL environment variable',
    }, { status: 500 });
  }
}

