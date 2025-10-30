import { NextResponse } from 'next/server';
import { db, users } from '@/server/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
      });
    }

    // Test bcrypt comparison
    const isMatch = await bcrypt.compare(password, user[0].passwordHash);

    return NextResponse.json({
      success: isMatch,
      message: isMatch ? 'Password matches!' : 'Password does NOT match',
      details: {
        email: user[0].email,
        userId: user[0].id,
        passwordProvided: password.length + ' characters',
        hashExists: !!user[0].passwordHash,
        hashLength: user[0].passwordHash?.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

