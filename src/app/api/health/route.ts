import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL ? 'true' : 'false',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
      nextAuthUrl: process.env.NEXTAUTH_URL ? 'set' : 'missing',
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing',
    },
    services: {
      auth: process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL ? 'configured' : 'misconfigured',
      database: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy') ? 'configured' : 'misconfigured',
    }
  };

  const status = health.services.auth === 'configured' && health.services.database === 'configured' ? 200 : 503;
  
  return NextResponse.json(health, { status });
}