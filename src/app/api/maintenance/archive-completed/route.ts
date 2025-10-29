import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Archive completed tasks from before this week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const archived = await db
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

    // Delete tasks older than 6 months (180 days)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.archived, true), lt(tasks.archivedAt, sixMonthsAgo)))
      .returning();

    return NextResponse.json({
      ok: true,
      archivedCount: archived.length,
      deletedCount: deleted.length,
      message: 'Weekly archive and cleanup completed',
    });
  } catch (error) {
    console.error('Archive/cleanup failed:', error);
    return NextResponse.json(
      { error: 'Archive/cleanup failed', details: String(error) },
      { status: 500 }
    );
  }
}
