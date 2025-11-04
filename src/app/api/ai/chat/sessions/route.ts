import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { aiChatSessions, aiChatMessages } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/ai/chat/sessions
 * List all chat sessions for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await db
      .select({
        id: aiChatSessions.id,
        title: aiChatSessions.title,
        createdAt: aiChatSessions.createdAt,
        lastMessageAt: aiChatSessions.lastMessageAt,
        isActive: aiChatSessions.isActive,
      })
      .from(aiChatSessions)
      .where(eq(aiChatSessions.userId, session.user.id))
      .orderBy(desc(aiChatSessions.lastMessageAt))
      .limit(50);

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('[Chat Sessions] Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/chat/sessions
 * Create a new chat session
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, initialMessage } = await req.json();

    // Generate title from initial message if not provided
    const sessionTitle =
      title ||
      (initialMessage
        ? initialMessage.substring(0, 50) +
          (initialMessage.length > 50 ? '...' : '')
        : 'New Chat');

    // Create session
    const [newSession] = await db
      .insert(aiChatSessions)
      .values({
        userId: session.user.id,
        title: sessionTitle,
      })
      .returning();

    // Add initial message if provided
    if (initialMessage) {
      await db.insert(aiChatMessages).values({
        sessionId: newSession.id,
        role: 'user',
        content: initialMessage,
      });
    }

    return NextResponse.json({ session: newSession });
  } catch (error: any) {
    console.error('[Chat Sessions] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
