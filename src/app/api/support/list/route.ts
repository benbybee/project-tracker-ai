import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets, ticketAttachments } from '@/server/db/schema';
import { desc, eq, ne } from 'drizzle-orm';

// GET -> { tickets: Ticket[] }
// Query params: ?includeCompleted=true to show completed tickets
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we should include completed tickets
    const { searchParams } = new URL(req.url);
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    // Query tickets, filtering out completed ones by default
    const allTickets = includeCompleted
      ? await db
          .select()
          .from(tickets)
          .orderBy(desc(tickets.createdAt))
          .limit(100)
      : await db
          .select()
          .from(tickets)
          .where(ne(tickets.status, 'complete'))
          .orderBy(desc(tickets.createdAt))
          .limit(100);

    // Get attachments for each ticket
    const ticketsWithAttachments = await Promise.all(
      allTickets.map(async (ticket) => {
        const attachments = await db
          .select()
          .from(ticketAttachments)
          .where(eq(ticketAttachments.ticketId, ticket.id));

        return {
          id: ticket.id,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
          customerName: ticket.customerName,
          customerEmail: ticket.customerEmail,
          projectName: ticket.projectName,
          domain: ticket.domain,
          details: ticket.details,
          dueDateSuggested: ticket.dueDateSuggested || null,
          priority: ticket.priority,
          status: ticket.status,
          aiEta: ticket.aiEta || null,
          aiSummary: ticket.aiSummary,
          suggestedProjectId: ticket.suggestedProjectId || null,
          completedAt: ticket.completedAt?.toISOString() || null,
          attachments: attachments.map((a) => ({
            id: a.id,
            name: a.fileName,
            size: a.fileSize,
            url: a.url,
          })),
        };
      })
    );

    return NextResponse.json({
      tickets: ticketsWithAttachments,
    });
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets', tickets: [] },
      { status: 500 }
    );
  }
}
