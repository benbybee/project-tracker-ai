import { NextResponse } from 'next/server';
import { db, users } from '@/server/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and newPassword are required' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const updated = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.email, email))
      .returning({ email: users.email });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: `User with email "${email}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for ${email}`,
      email: updated[0].email,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Password reset failed',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

