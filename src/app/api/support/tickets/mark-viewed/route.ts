import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Update ticket status to 'viewed' if it's currently 'new'
    await db
      .update(tickets)
      .set({
        status: 'viewed',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to mark ticket as viewed:', error);
    return NextResponse.json(
      { error: 'Failed to mark ticket as viewed' },
      { status: 500 }
    );
  }
}
