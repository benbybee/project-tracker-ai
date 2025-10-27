import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find tasks that are completed and updated before start of current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek; // If Sunday, go back 7 days
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    // Archive completed tasks from before this week
    const result = await db
      .update(tasks)
      .set({
        archived: true,
        archivedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.status, 'completed'),
          eq(tasks.archived, false),
          lt(tasks.updatedAt, startOfWeek)
        )
      )
      .returning();

    return NextResponse.json({
      ok: true,
      message: 'Archive completed',
      archivedCount: result.length,
    });
  } catch (error) {
    console.error('Archive failed:', error);
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 });
  }
}
