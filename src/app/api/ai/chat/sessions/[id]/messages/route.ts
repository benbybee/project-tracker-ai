import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { aiChatSessions, aiChatMessages } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/ai/chat/sessions/[id]/messages
 * Add a message to a session
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { role, content, metadata } = await req.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'tool'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Verify session exists and belongs to user
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

    // Add message
    const [newMessage] = await db
      .insert(aiChatMessages)
      .values({
        sessionId: id,
        role,
        content,
        metadata: metadata || null,
      })
      .returning();

    // Update session's lastMessageAt
    await db
      .update(aiChatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(aiChatSessions.id, id));

    return NextResponse.json({ message: newMessage });
  } catch (error: any) {
    console.error('[Chat Messages] Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}
