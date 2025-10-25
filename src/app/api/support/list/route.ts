import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets, ticketAttachments } from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET -> { tickets: Ticket[] }
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allTickets = await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt))
      .limit(100); // Paginate later

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
          attachments: attachments.map(a => ({
            id: a.id,
            name: a.fileName,
            size: a.fileSize,
            url: a.url,
          })),
        };
      })
    );

    return NextResponse.json({ 
      tickets: ticketsWithAttachments
    });
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets', tickets: [] },
      { status: 500 }
    );
  }
}

