import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { ticketReplies, tickets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// POST { ticketId, message }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, message } = await req.json();

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'Ticket ID and message are required' },
        { status: 400 }
      );
    }

    // Insert reply
    await db.insert(ticketReplies).values({
      ticketId,
      author: 'admin',
      message,
    });

    // Update ticket status to 'responded'
    await db
      .update(tickets)
      .set({
        status: 'responded',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    // TODO: Email requester with the reply (integrate Resend/SendGrid)

    return NextResponse.json({ ok: true, ticketId });
  } catch (error) {
    console.error('Failed to send reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
