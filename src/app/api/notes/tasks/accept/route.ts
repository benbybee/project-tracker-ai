import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tasks, notes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { logTaskActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, tasks: selectedTasks } = body;

    if (!noteId || !selectedTasks || selectedTasks.length === 0) {
      return NextResponse.json(
        { error: 'Note ID and tasks are required' },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to user
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
      .limit(1);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create tasks
    const createdTasks = [];
    for (const task of selectedTasks) {
      const [newTask] = await db
        .insert(tasks)
        .values({
          userId: session.user.id,
          projectId: task.projectId,
          title: task.title,
          description: task.description || '',
          status: 'not_started',
          priorityScore: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      createdTasks.push(newTask);

      // Log activity
      try {
        await logTaskActivity({
          userId: session.user.id,
          taskId: newTask.id,
          taskTitle: newTask.title,
          action: 'created',
          projectId: newTask.projectId,
          payload: {
            source: 'note',
            noteId: noteId,
            noteTitle: note.title,
          },
        });
      } catch (activityError) {
        console.error('Failed to log activity:', activityError);
        // Non-blocking - continue even if activity logging fails
      }
    }

    // Mark note as having generated tasks
    await db
      .update(notes)
      .set({
        tasksGenerated: true,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));

    return NextResponse.json({
      success: true,
      tasks: createdTasks,
      count: createdTasks.length,
    });
  } catch (error) {
    console.error('Failed to accept tasks:', error);
    return NextResponse.json(
      { error: 'Failed to create tasks' },
      { status: 500 }
    );
  }
}
