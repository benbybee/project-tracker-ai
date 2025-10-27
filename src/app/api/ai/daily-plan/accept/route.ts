import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tasks, aiSuggestions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan, acceptedTaskIds, deferredTaskIds, suggestionId } = body;

    if (!plan || !Array.isArray(acceptedTaskIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Update accepted tasks with suggested schedules
    const updates = [];
    for (const item of plan.plan) {
      if (acceptedTaskIds.includes(item.taskId)) {
        // Calculate due date/time based on suggested start time
        const today = new Date();
        const [hours, minutes] = item.suggestedStartTime.split(':');
        const scheduledTime = new Date(today);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        updates.push(
          db
            .update(tasks)
            .set({
              dueDate: scheduledTime.toISOString().split('T')[0],
              // Optionally store estimated duration in description or custom field
            })
            .where(eq(tasks.id, item.taskId))
        );
      }
    }

    // Update deferred tasks (remove from today)
    if (Array.isArray(deferredTaskIds)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const taskId of deferredTaskIds) {
        updates.push(
          db
            .update(tasks)
            .set({
              dueDate: tomorrow.toISOString().split('T')[0],
            })
            .where(eq(tasks.id, taskId))
        );
      }
    }

    await Promise.all(updates);

    // Log suggestion acceptance for learning
    if (suggestionId) {
      await db.insert(aiSuggestions).values({
        userId: session.user.id,
        suggestionType: 'daily_plan',
        suggestionData: {
          acceptedCount: acceptedTaskIds.length,
          deferredCount: deferredTaskIds?.length || 0,
        },
        accepted: true,
      });
    }

    return NextResponse.json({
      success: true,
      updated: acceptedTaskIds.length,
      deferred: deferredTaskIds?.length || 0,
    });
  } catch (error: any) {
    console.error('[AI Daily Plan Accept] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept plan' },
      { status: 500 }
    );
  }
}
