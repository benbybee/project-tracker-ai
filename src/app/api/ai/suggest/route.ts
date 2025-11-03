import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { planningEngine } from '@/lib/ai/planning-engine';
import { patternAnalyzer } from '@/lib/ai/pattern-analyzer';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { eq, or, lte } from 'drizzle-orm';
import { activityLogger } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentView, userActivity } = body;

    // Get user's patterns
    const patterns = await patternAnalyzer.getStoredPatterns(session.user.id);

    // Get relevant tasks based on context
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const relevantTasks = await db
      .select()
      .from(tasks)
      .where(
        or(
          lte(tasks.dueDate, today.toISOString().split('T')[0]),
          eq(tasks.status, 'in_progress')
        )
      )
      .limit(10);

    const tasksForContext = relevantTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priorityScore || '2',
    }));

    // Generate contextual suggestions
    const suggestions = await planningEngine.generateContextualSuggestions(
      session.user.id,
      {
        currentView: currentView || 'dashboard',
        userActivity: userActivity || 'viewing tasks',
        relevantTasks: tasksForContext,
        patterns: patterns || undefined,
      }
    );

    // Create notifications for high-priority suggestions
    if (suggestions && suggestions.length > 0) {
      for (const suggestion of suggestions) {
        // Only notify for high-priority suggestions to avoid notification fatigue
        if (suggestion.priority === 'high') {
          try {
            await activityLogger.createNotification({
              userId: session.user.id,
              type: 'ai_suggestion',
              title: '🤖 AI Suggestion',
              message: suggestion.message || suggestion.title,
              link: suggestion.action?.link || '/dashboard',
              metadata: {
                suggestion: {
                  type: suggestion.type,
                  title: suggestion.title,
                  priority: suggestion.priority,
                },
              },
            });
          } catch (notifError) {
            // Don't fail the whole request if notification fails
            console.error(
              '[AI Suggest] Failed to create notification:',
              notifError
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('[AI Suggest] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
