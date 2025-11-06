import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { projects, tasks, roles, subtasks } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { logProjectActivity, logTaskActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmationData } = await req.json();

    if (!confirmationData || !confirmationData.action) {
      return NextResponse.json(
        { error: 'Invalid confirmation data' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const { action, details } = confirmationData;

    console.log('[AI Chat Execute]', action, details);

    switch (action) {
      // Note: create and update operations now execute immediately in executeTool()
      // This endpoint only handles delete operations which require confirmation

      case 'delete_project': {
        const [project] = await db
          .delete(projects)
          .where(
            and(
              eq(projects.id, confirmationData.projectId),
              eq(projects.userId, userId)
            )
          )
          .returning();

        if (!project) {
          return NextResponse.json(
            { error: 'Project not found' },
            { status: 404 }
          );
        }

        // Log activity
        await logProjectActivity({
          userId,
          projectId: project.id,
          projectName: confirmationData.projectName,
          action: 'deleted',
          payload: {},
        });

        return NextResponse.json({
          success: true,
          message: `Project "${confirmationData.projectName}" deleted successfully!`,
        });
      }

      case 'delete_task': {
        const [task] = await db
          .delete(tasks)
          .where(
            and(eq(tasks.id, confirmationData.taskId), eq(tasks.userId, userId))
          )
          .returning();

        if (!task) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }

        // Delete subtasks
        await db.delete(subtasks).where(eq(subtasks.taskId, task.id));

        // Log activity
        await logTaskActivity({
          userId,
          taskId: task.id,
          taskTitle: confirmationData.taskTitle,
          action: 'deleted',
          projectId: task.projectId,
          payload: {},
        });

        return NextResponse.json({
          success: true,
          message: `Task "${confirmationData.taskTitle}" deleted successfully!`,
        });
      }

      case 'delete_role': {
        const [role] = await db
          .delete(roles)
          .where(
            and(eq(roles.id, confirmationData.roleId), eq(roles.userId, userId))
          )
          .returning();

        if (!role) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Role "${confirmationData.roleName}" deleted successfully!`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[AI Chat Execute] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute action' },
      { status: 500 }
    );
  }
}
