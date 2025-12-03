import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { aiChatSessions } from '@/server/db/schema';
import { lt } from 'drizzle-orm';

/**
 * POST /api/ai/chat/cleanup
 * Cleanup chat sessions older than 48 hours
 * Intended to be called via cron job
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date 48 hours ago
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    console.log('[AI Chat Cleanup] Starting cleanup job', {
      cutoffDate: fortyEightHoursAgo.toISOString(),
    });

    // Delete sessions older than 48 hours (cascade will delete messages)
    const deleted = await db
      .delete(aiChatSessions)
      .where(lt(aiChatSessions.createdAt, fortyEightHoursAgo))
      .returning({ id: aiChatSessions.id });

    console.log('[AI Chat Cleanup] Cleanup completed', {
      deletedCount: deleted.length,
      sessionIds: deleted.map((s) => s.id),
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} chat session(s) older than 48 hours`,
      deletedCount: deleted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[AI Chat Cleanup] Error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup job failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/chat/cleanup
 * Preview how many sessions would be deleted (for testing)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date 48 hours ago
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // Count sessions that would be deleted
    const sessions = await db
      .select({ id: aiChatSessions.id, createdAt: aiChatSessions.createdAt })
      .from(aiChatSessions)
      .where(lt(aiChatSessions.createdAt, fortyEightHoursAgo));

    return NextResponse.json({
      preview: true,
      count: sessions.length,
      cutoffDate: fortyEightHoursAgo.toISOString(),
      sessions: sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[AI Chat Cleanup Preview] Error:', error);
    return NextResponse.json(
      { error: 'Preview failed', details: error.message },
      { status: 500 }
    );
  }
}
