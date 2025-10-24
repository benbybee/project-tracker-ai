import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { plaudPending, projects, tasks } from '@/server/db/schema';
import { inArray } from 'drizzle-orm';

// POST { tasks: [{ id: string; title: string; description?: string; projectId?: string; projectNameNew?: string }] }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tasks: incomingTasks } = await req.json();

    if (!Array.isArray(incomingTasks) || incomingTasks.length === 0) {
      return NextResponse.json({ ok: false, error: 'No tasks provided' }, { status: 400 });
    }

    const createdTasks = [];
    const idsToDelete: string[] = [];

    for (const task of incomingTasks) {
      let projectId = task.projectId;

      // If projectNameNew is provided, create a new project first
      if (task.projectNameNew && task.projectNameNew.trim()) {
        const [newProject] = await db.insert(projects).values({
          name: task.projectNameNew.trim(),
          type: 'general',
          description: `Created from Plaud AI: ${task.title}`,
        }).returning();
        projectId = newProject.id;
      }

      // Create the task
      if (projectId) {
        const [newTask] = await db.insert(tasks).values({
          title: task.title,
          description: task.description || '',
          projectId,
          status: 'not_started',
        }).returning();
        createdTasks.push(newTask);
      }

      // Mark this pending item for deletion
      idsToDelete.push(task.id);
    }

    // Delete accepted items from plaud_pending
    if (idsToDelete.length > 0) {
      await db.delete(plaudPending).where(inArray(plaudPending.id, idsToDelete));
    }

    return NextResponse.json({ 
      ok: true, 
      created: createdTasks.length,
      deleted: idsToDelete.length
    });
  } catch (error) {
    console.error('Failed to accept Plaud tasks:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to accept tasks' },
      { status: 500 }
    );
  }
}

