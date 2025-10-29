import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { planningEngine } from '@/lib/ai/planning-engine';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, projectId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get other tasks in the project for context
    let otherTasks: any[] = [];
    if (projectId) {
      otherTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .limit(5);
    }

    const otherTasksForContext = otherTasks.map((t) => ({
      title: t.title,
      priority: t.priorityScore || '2',
      dueDate: t.dueDate || undefined,
    }));

    // Get duration estimate
    const estimate = await planningEngine.estimateTaskDuration(
      session.user.id,
      title,
      description
    );

    // Get priority suggestion
    const prioritySuggestion = await planningEngine.suggestPriority(
      session.user.id,
      { title, description, dueDate: undefined },
      otherTasksForContext,
      new Date()
    );

    return NextResponse.json({
      success: true,
      estimate,
      prioritySuggestion,
    });
  } catch (error: any) {
    console.error('[AI Task Suggest] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
