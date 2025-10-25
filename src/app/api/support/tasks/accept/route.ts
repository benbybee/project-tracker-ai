import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { projects, tasks, tickets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// POST { ticketId, tasks: [{ title, description?, projectId?, projectNameNew? }] }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, tasks: proposedTasks } = await req.json();

    if (
      !ticketId ||
      !Array.isArray(proposedTasks) ||
      proposedTasks.length === 0
    ) {
      return NextResponse.json(
        { error: 'Ticket ID and tasks array are required' },
        { status: 400 }
      );
    }

    const createdTasks = [];

    for (const task of proposedTasks) {
      let projectId = task.projectId;

      // If projectNameNew is provided, create a new project first
      if (task.projectNameNew && task.projectNameNew.trim()) {
        const [newProject] = await db
          .insert(projects)
          .values({
            name: task.projectNameNew.trim(),
            type: 'general',
            description: `Created from support ticket ${ticketId}`,
          })
          .returning();
        projectId = newProject.id;
      }

      // Create the task
      if (projectId) {
        const [newTask] = await db
          .insert(tasks)
          .values({
            title: task.title,
            description: task.description || '',
            projectId,
            status: 'not_started',
          })
          .returning();
        createdTasks.push(newTask);
      }
    }

    // Update ticket status to 'converted'
    await db
      .update(tickets)
      .set({
        status: 'converted',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return NextResponse.json({
      ok: true,
      created: createdTasks.length,
    });
  } catch (error) {
    console.error('Failed to accept tasks:', error);
    return NextResponse.json(
      { error: 'Failed to accept tasks' },
      { status: 500 }
    );
  }
}
