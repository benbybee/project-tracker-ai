import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { projects, tasks, tickets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getWebSocketClient } from '@/lib/ws-client';

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
            userId: session.user.id,
            name: task.projectNameNew.trim(),
            type: 'general',
            description: `Created from support ticket ${ticketId}`,
          })
          .returning();
        projectId = newProject.id;
      }

      // Create the task
      if (projectId) {
        // Get project's default role
        const [project] = await db
          .select({ roleId: projects.roleId })
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1);

        const [newTask] = await db
          .insert(tasks)
          .values({
            userId: session.user.id,
            title: task.title,
            description: task.description || '',
            projectId,
            roleId: project?.roleId || null,
            ticketId,
            status: 'not_started',
            priorityScore: '2', // Default priority
            isDaily: false,
          })
          .returning();

        createdTasks.push(newTask);
      }
    }

    // Update ticket status to 'pending_tasks'
    await db
      .update(tickets)
      .set({
        status: 'pending_tasks',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    // Broadcast real-time update
    try {
      const wsClient = getWebSocketClient();
      if (wsClient && wsClient.isConnected()) {
        wsClient.broadcastUpdate('task', ticketId, {
          type: 'task_created',
          entityType: 'task',
          entityId: ticketId,
          data: { ticketId, count: createdTasks.length },
        });
      }
    } catch (wsError) {
      console.error('Failed to broadcast real-time update:', wsError);
    }

    return NextResponse.json({
      ok: true,
      created: createdTasks.length,
    });
  } catch (error: any) {
    console.error('Failed to accept tasks:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to accept tasks',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
