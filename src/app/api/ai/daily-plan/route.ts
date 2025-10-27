import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { planningEngine } from '@/lib/ai/planning-engine';
import { patternAnalyzer } from '@/lib/ai/pattern-analyzer';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { eq, and, or, lte, isNull } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's patterns
    const patterns = await patternAnalyzer.getStoredPatterns(session.user.id);

    // If no patterns exist, analyze them first
    if (!patterns) {
      await patternAnalyzer.analyzeUserPatterns(session.user.id);
      // Fetch again after analysis
      const newPatterns = await patternAnalyzer.getStoredPatterns(
        session.user.id
      );
      if (newPatterns) {
        patterns || newPatterns;
      }
    }

    // Fetch tasks that need planning
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get tasks that are:
    // 1. Due today or overdue
    // 2. Not started or in progress
    // 3. Not completed
    const relevantTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          or(
            lte(tasks.dueDate, today.toISOString().split('T')[0]),
            isNull(tasks.dueDate)
          ),
          or(eq(tasks.status, 'not_started'), eq(tasks.status, 'in_progress'))
        )
      )
      .limit(20);

    // Format tasks for AI
    const tasksForAI = relevantTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      priority: t.priorityScore || '2',
      status: t.status,
      dueDate: t.dueDate || undefined,
      role: t.roleId || undefined,
    }));

    // Generate plan using AI
    const plan = await planningEngine.generateDailyPlan(session.user.id, {
      currentTime: new Date(),
      tasks: tasksForAI,
      userPatterns: patterns || undefined,
      workingHoursStart: 9,
      workingHoursEnd: 17,
    });

    return NextResponse.json({
      success: true,
      plan,
      tasksAnalyzed: tasksForAI.length,
    });
  } catch (error: any) {
    console.error('[AI Daily Plan] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
