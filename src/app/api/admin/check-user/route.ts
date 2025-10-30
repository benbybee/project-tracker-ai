import { NextResponse } from 'next/server';
import { db, users } from '@/server/db';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required' },
      { status: 400 }
    );
  }

  try {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        hasPassword: sql`CASE WHEN ${users.passwordHash} IS NOT NULL THEN true ELSE false END`,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({
        exists: false,
        message: `User with email "${email}" not found in database`,
        hint: 'You may need to sign up first or run the seed script',
      });
    }

    return NextResponse.json({
      exists: true,
      user: {
        id: user[0].id,
        email: user[0].email,
        createdAt: user[0].createdAt,
        hasPassword: user[0].hasPassword,
      },
      message: 'User found in database',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Database query failed',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
