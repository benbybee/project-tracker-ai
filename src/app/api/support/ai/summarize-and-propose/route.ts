import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// POST { ticketId } -> { summary, tasks: [{id,title,description}] }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await req.json();

    // Fetch ticket details
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // TODO: Call your AI model (OpenAI) to analyze ticket.details and generate summary + tasks
    // For now, return stub data based on ticket content
    const summary = `AI Summary: "${ticket.projectName}" requires ${ticket.priority} priority attention. ` +
      `The request involves: ${ticket.details.slice(0, 100)}... ` +
      `Estimated completion: ${ticket.aiEta || 'TBD'}.`;

    const tasks = [
      { 
        id: randomUUID(), 
        title: `Initial review: ${ticket.projectName}`, 
        description: 'Clarify scope, requirements, and success criteria with requester' 
      },
      { 
        id: randomUUID(), 
        title: 'Implement core changes', 
        description: `Development work for: ${ticket.details.slice(0, 60)}...` 
      },
      { 
        id: randomUUID(), 
        title: 'QA & UAT', 
        description: 'Validate implementation and gather sign-off from requester' 
      },
    ];

    // Update ticket with AI summary
    await db
      .update(tickets)
      .set({ 
        aiSummary: summary,
        status: 'in_review',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return NextResponse.json({
      summary,
      tasks
    });
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI summary' },
      { status: 500 }
    );
  }
}

