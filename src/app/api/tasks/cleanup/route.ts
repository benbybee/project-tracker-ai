import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete tasks older than 6 months (180 days)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.archived, true), lt(tasks.archivedAt, sixMonthsAgo)))
      .returning();

    return NextResponse.json({
      ok: true,
      message: 'Cleanup completed',
      deletedCount: result.length,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

// Also support POST for cron jobs
export async function POST() {
  return DELETE();
}
