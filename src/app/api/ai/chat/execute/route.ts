import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { projects, tasks, roles, subtasks } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { upsertEmbedding } from '@/server/search/upsertEmbedding';
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
      case 'create_project': {
        const [project] = await db
          .insert(projects)
          .values({
            userId,
            name: details.name,
            type: details.type,
            description: details.description || '',
            roleId: details.roleId || null,
            domain: details.domain || null,
          })
          .returning();

        // Create embedding
        await upsertEmbedding({
          entityType: 'project',
          entityId: project.id,
          text: [
            project.name,
            project.description || '',
            project.domain || '',
          ].join('\n'),
        });

        // Log activity
        await logProjectActivity({
          userId,
          projectId: project.id,
          projectName: project.name,
          action: 'created',
          payload: { type: project.type },
        });

        return NextResponse.json({
          success: true,
          message: `Project "${project.name}" created successfully!`,
          data: {
            id: project.id,
            name: project.name,
            type: project.type,
          },
        });
      }

      case 'update_project': {
        const [project] = await db
          .update(projects)
          .set({
            ...details,
            updatedAt: new Date(),
          })
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

        // Update embedding
        await upsertEmbedding({
          entityType: 'project',
          entityId: project.id,
          text: [
            project.name,
            project.description || '',
            project.domain || '',
          ].join('\n'),
        });

        // Log activity
        await logProjectActivity({
          userId,
          projectId: project.id,
          projectName: project.name,
          action: 'updated',
          payload: details,
        });

        return NextResponse.json({
          success: true,
          message: `Project "${project.name}" updated successfully!`,
          data: {
            id: project.id,
            name: project.name,
          },
        });
      }

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

      case 'create_task': {
        const [task] = await db
          .insert(tasks)
          .values({
            userId,
            projectId: confirmationData.projectId,
            title: details.title,
            description: details.description || '',
            status: details.status || 'not_started',
            dueDate: details.dueDate || null,
            priorityScore: details.priorityScore || '2',
            isDaily: details.isDaily || false,
          })
          .returning();

        // Create embedding
        await upsertEmbedding({
          entityType: 'task',
          entityId: task.id,
          text: [task.title, task.description || ''].join('\n'),
        });

        // Log activity
        await logTaskActivity({
          userId,
          taskId: task.id,
          taskTitle: task.title,
          action: 'created',
          projectId: task.projectId,
          payload: {
            status: task.status,
            priorityScore: task.priorityScore,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Task "${task.title}" created successfully in project "${confirmationData.projectName}"!`,
          data: {
            id: task.id,
            title: task.title,
          },
        });
      }

      case 'update_task': {
        const [task] = await db
          .update(tasks)
          .set({
            ...details,
            updatedAt: new Date(),
          })
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

        // Update embedding
        await upsertEmbedding({
          entityType: 'task',
          entityId: task.id,
          text: [task.title, task.description || ''].join('\n'),
        });

        // Log activity
        await logTaskActivity({
          userId,
          taskId: task.id,
          taskTitle: task.title,
          action: 'updated',
          projectId: task.projectId,
          payload: details,
        });

        return NextResponse.json({
          success: true,
          message: `Task "${task.title}" updated successfully!`,
          data: {
            id: task.id,
            title: task.title,
          },
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

      case 'create_role': {
        const [role] = await db
          .insert(roles)
          .values({
            userId,
            name: details.name,
            color: details.color,
          })
          .returning();

        return NextResponse.json({
          success: true,
          message: `Role "${role.name}" created successfully!`,
          data: {
            id: role.id,
            name: role.name,
            color: role.color,
          },
        });
      }

      case 'update_role': {
        const [role] = await db
          .update(roles)
          .set({
            ...details,
            updatedAt: new Date(),
          })
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
          message: `Role "${role.name}" updated successfully!`,
          data: {
            id: role.id,
            name: role.name,
            color: role.color,
          },
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
