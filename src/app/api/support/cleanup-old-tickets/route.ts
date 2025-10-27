import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { and, eq, lt } from 'drizzle-orm';

/**
 * POST /api/support/cleanup-old-tickets
 * Deletes completed tickets older than 90 days
 * This can be called manually or via a cron job
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find completed tickets older than 90 days
    const oldTickets = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(
        and(
          eq(tickets.status, 'complete'),
          lt(tickets.completedAt, ninetyDaysAgo)
        )
      );

    if (oldTickets.length === 0) {
      return NextResponse.json({
        deleted: 0,
        message: 'No old completed tickets to delete',
      });
    }

    // Delete the old tickets (cascade will delete related data)
    const ticketIds = oldTickets.map((t) => t.id);
    for (const ticketId of ticketIds) {
      await db.delete(tickets).where(eq(tickets.id, ticketId));
    }

    return NextResponse.json({
      deleted: ticketIds.length,
      message: `Deleted ${ticketIds.length} completed ticket(s) older than 90 days`,
      ticketIds,
    });
  } catch (error) {
    console.error('Failed to cleanup old tickets:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup old tickets' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/support/cleanup-old-tickets
 * Preview how many tickets would be deleted without actually deleting them
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find completed tickets older than 90 days
    const oldTickets = await db
      .select({
        id: tickets.id,
        projectName: tickets.projectName,
        completedAt: tickets.completedAt,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .where(
        and(
          eq(tickets.status, 'complete'),
          lt(tickets.completedAt, ninetyDaysAgo)
        )
      );

    return NextResponse.json({
      count: oldTickets.length,
      tickets: oldTickets.map((t) => ({
        id: t.id,
        projectName: t.projectName,
        completedAt: t.completedAt?.toISOString(),
        createdAt: t.createdAt.toISOString(),
        age: Math.floor(
          (Date.now() - (t.completedAt?.getTime() || 0)) / (1000 * 60 * 60 * 24)
        ),
      })),
    });
  } catch (error) {
    console.error('Failed to preview old tickets:', error);
    return NextResponse.json(
      { error: 'Failed to preview old tickets' },
      { status: 500 }
    );
  }
}
