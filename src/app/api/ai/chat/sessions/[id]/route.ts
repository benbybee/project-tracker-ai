import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { aiChatSessions, aiChatMessages } from '@/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * GET /api/ai/chat/sessions/[id]
 * Get a specific session with all its messages
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get session
    const [chatSession] = await db
      .select()
      .from(aiChatSessions)
      .where(
        and(
          eq(aiChatSessions.id, id),
          eq(aiChatSessions.userId, session.user.id)
        )
      )
      .limit(1);

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get messages
    const messages = await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, id))
      .orderBy(asc(aiChatMessages.createdAt));

    return NextResponse.json({
      session: chatSession,
      messages,
    });
  } catch (error: any) {
    console.error('[Chat Session] Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/chat/sessions/[id]
 * Delete a specific session
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and delete
    const result = await db
      .delete(aiChatSessions)
      .where(
        and(
          eq(aiChatSessions.id, id),
          eq(aiChatSessions.userId, session.user.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Session deleted' });
  } catch (error: any) {
    console.error('[Chat Session] Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/chat/sessions/[id]
 * Update session title
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Update session
    const [updated] = await db
      .update(aiChatSessions)
      .set({ title: title.substring(0, 100) })
      .where(
        and(
          eq(aiChatSessions.id, id),
          eq(aiChatSessions.userId, session.user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: updated });
  } catch (error: any) {
    console.error('[Chat Session] Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
