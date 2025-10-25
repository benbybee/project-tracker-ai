import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

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

    return NextResponse.json({ 
      tickets: allTickets.map(t => ({
        id: t.id,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        projectName: t.projectName,
        domain: t.domain,
        details: t.details,
        dueDateSuggested: t.dueDateSuggested || null,
        priority: t.priority,
        status: t.status,
        aiEta: t.aiEta || null,
        aiSummary: t.aiSummary,
        suggestedProjectId: t.suggestedProjectId || null,
      }))
    });
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets', tickets: [] },
      { status: 500 }
    );
  }
}

