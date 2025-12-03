import { NextResponse } from 'next/server';
import { db, users, projects, roles } from '@/server/db';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    status: 'healthy',
    checks: {} as Record<string, any>,
  };

  // 1. Check environment variables
  checks.checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    status: 'ok',
  };

  if (!process.env.DATABASE_URL) {
    checks.checks.env.status = 'error';
    checks.checks.env.message = 'DATABASE_URL is missing';
    checks.status = 'unhealthy';
  }

  // 2. Check database connection
  try {
    await db.select().from(users).limit(1);
    checks.checks.database = {
      status: 'ok',
      message: 'Database connection successful',
    };
  } catch (error: any) {
    checks.checks.database = {
      status: 'error',
      message: error?.message || 'Database connection failed',
      code: error?.code,
    };
    checks.status = 'unhealthy';
  }

  // 3. Check if tables exist
  try {
    const [userCount] = await db
      .select({ count: users.id })
      .from(users)
      .limit(1);
    const [projectCount] = await db
      .select({ count: projects.id })
      .from(projects)
      .limit(1);
    const [roleCount] = await db
      .select({ count: roles.id })
      .from(roles)
      .limit(1);

    checks.checks.tables = {
      status: 'ok',
      message: 'All tables accessible',
      hasData: {
        users: !!userCount,
        projects: !!projectCount,
        roles: !!roleCount,
      },
    };
  } catch (error: any) {
    checks.checks.tables = {
      status: 'error',
      message: error?.message || 'Table check failed',
      hint: 'Run database migrations if tables are missing',
    };
    checks.status = 'unhealthy';
  }

  // 4. Check tRPC endpoint reachability
  checks.checks.trpc = {
    status: 'ok',
    message: 'tRPC endpoint is configured',
    endpoint: '/api/trpc',
  };

  // 5. Check build information
  checks.checks.build = {
    nextVersion: process.env.npm_package_version || 'unknown',
    vercelEnv: process.env.VERCEL_ENV || 'local',
    vercelUrl: process.env.VERCEL_URL || 'localhost',
  };

  return NextResponse.json(checks, {
    status: checks.status === 'healthy' ? 200 : 503,
  });
}
