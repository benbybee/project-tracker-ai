import { NextResponse } from 'next/server';
import { db, users } from '@/server/db';

export async function GET() {
  try {
    // Test database connection
    await db.select().from(users).limit(1);

    return NextResponse.json({
      ok: true,
      message: '✅ Database connection successful',
      status: 'connected',
    });
  } catch (error: any) {
    const isConnectionError = 
      error?.code === 'ECONNREFUSED' || 
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('Connection refused') ||
      error?.message?.includes('connect ECONNREFUSED');

    const errorResponse = {
      ok: false,
      status: 'error',
      error: error?.message || 'Unknown database error',
      code: error?.code,
      ...(isConnectionError && {
        reason: 'DATABASE_NOT_ACCESSIBLE',
        message: '❌ Cannot connect to PostgreSQL database',
        possibleCauses: [
          'DATABASE_URL not configured in .env file',
          'PostgreSQL server is not running',
          'Incorrect database credentials',
          'Database host/port is unreachable',
        ],
        solution: {
          step1: 'Check if .env file exists with valid DATABASE_URL',
          step2: 'For Supabase: Copy connection string from project settings',
          step3: 'For local PostgreSQL: Ensure PostgreSQL is running on port 5432',
          step4: 'Restart the development server after updating .env',
        },
      }),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

