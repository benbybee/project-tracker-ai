import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets, tasks } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/support/check-completion
 * Check if all tasks for a ticket are completed and update ticket status accordingly
 * Body: { ticketId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ticketId is required' },
        { status: 400 }
      );
    }

    // Get the ticket
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get all tasks associated with this ticket
    const ticketTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.ticketId, ticketId));

    // Check if we should update the status
    const shouldUpdate =
      // Ticket has tasks
      ticketTasks.length > 0 &&
      // Ticket is not already complete
      ticket.status !== 'complete' &&
      // All tasks are completed
      ticketTasks.every((task) => task.status === 'completed');

    if (shouldUpdate) {
      // Update ticket to complete status
      await db
        .update(tickets)
        .set({
          status: 'complete',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, ticketId));

      return NextResponse.json({
        updated: true,
        message: 'Ticket marked as complete',
        completedTasksCount: ticketTasks.length,
      });
    }

    // Check if ticket should be moved back to pending_tasks
    const shouldMoveToPending =
      // Ticket has tasks
      ticketTasks.length > 0 &&
      // Ticket is currently complete
      ticket.status === 'complete' &&
      // Some tasks are not completed
      ticketTasks.some((task) => task.status !== 'completed');

    if (shouldMoveToPending) {
      // Move ticket back to pending_tasks
      await db
        .update(tickets)
        .set({
          status: 'pending_tasks',
          completedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, ticketId));

      return NextResponse.json({
        updated: true,
        message: 'Ticket moved back to pending tasks',
        incompleteTasksCount: ticketTasks.filter(
          (t) => t.status !== 'completed'
        ).length,
      });
    }

    return NextResponse.json({
      updated: false,
      message: 'No status update needed',
      totalTasks: ticketTasks.length,
      completedTasks: ticketTasks.filter((t) => t.status === 'completed')
        .length,
      currentStatus: ticket.status,
    });
  } catch (error) {
    console.error('Failed to check ticket completion:', error);
    return NextResponse.json(
      { error: 'Failed to check ticket completion' },
      { status: 500 }
    );
  }
}
