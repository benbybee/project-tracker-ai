import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';

export async function GET() {
  try {
    // Test if tickets table exists by attempting a count query
    const result = await db.select().from(tickets).limit(0);

    return NextResponse.json({
      ok: true,
      message: 'Tickets table exists and is accessible',
      tablesReady: true,
    });
  } catch (error: any) {
    // If error contains "does not exist" or "relation", table doesn't exist
    const isTableMissing =
      error?.message?.includes('does not exist') ||
      error?.message?.includes('relation') ||
      error?.code === '42P01';

    if (isTableMissing) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tickets table does not exist in database',
          message:
            'Please run migration 0004_familiar_may_parker.sql on your production database',
          hint: 'Copy the SQL from src/server/db/migrations/0004_familiar_may_parker.sql and run it against your database',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Database connection failed',
        hint: 'Check DATABASE_URL environment variable',
        details:
          process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
