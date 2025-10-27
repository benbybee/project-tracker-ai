import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, projects } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { logSyncActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { ops } = await req.json();

    if (!Array.isArray(ops) || ops.length === 0) {
      return NextResponse.json({
        applied: [],
        conflicts: [],
        serverVersion: Date.now(),
      });
    }

    const applied: string[] = [];
    const conflicts: any[] = [];
    const serverVersion = Date.now();

    let tasksProcessed = 0;
    let projectsProcessed = 0;

    // Process each operation
    for (const op of ops) {
      try {
        const { entityType, entityId, action, payload, baseVersion } = op;

        if (entityType === 'task') {
          await processTaskOp(
            entityId,
            action,
            payload,
            baseVersion,
            applied,
            conflicts
          );
          tasksProcessed++;
        } else if (entityType === 'project') {
          await processProjectOp(
            entityId,
            action,
            payload,
            baseVersion,
            applied,
            conflicts
          );
          projectsProcessed++;
        }
      } catch (error) {
        console.error('Error processing op:', op, error);
        conflicts.push({
          entityType: op.entityType,
          entityId: op.entityId,
          local: op.payload,
          remote: null,
          reason: 'processing_error',
        });
      }
    }

    // Log sync activity
    if (session?.user?.id) {
      await logSyncActivity({
        userId: session.user.id,
        tasksCount: tasksProcessed,
        projectsCount: projectsProcessed,
        conflictsCount: conflicts.length,
        payload: {
          direction: 'push',
          appliedCount: applied.length,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ applied, conflicts, serverVersion });
  } catch (e) {
    console.error('Push sync error:', e);
    return NextResponse.json({ error: 'push failed' }, { status: 500 });
  }
}

async function processTaskOp(
  entityId: string,
  action: string,
  payload: any,
  baseVersion: number | undefined,
  applied: string[],
  conflicts: any[]
) {
  const existingTask = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, entityId))
    .limit(1);

  if (action === 'create') {
    if (existingTask.length > 0) {
      // Conflict: task already exists
      conflicts.push({
        entityType: 'task',
        entityId,
        local: payload,
        remote: existingTask[0],
        reason: 'already_exists',
      });
    } else {
      // Create new task
      await db.insert(tasks).values({
        id: entityId,
        ...payload,
        updatedAt: new Date(),
      });
      applied.push(entityId);
    }
  } else if (action === 'update') {
    if (existingTask.length === 0) {
      // Conflict: task doesn't exist
      conflicts.push({
        entityType: 'task',
        entityId,
        local: payload,
        remote: null,
        reason: 'not_found',
      });
    } else {
      const currentTask = existingTask[0];
      // Check version conflict if baseVersion is provided
      if (
        baseVersion !== undefined &&
        currentTask.updatedAt.getTime() > baseVersion
      ) {
        conflicts.push({
          entityType: 'task',
          entityId,
          local: payload,
          remote: currentTask,
          reason: 'stale_version',
        });
      } else {
        // Update task
        await db
          .update(tasks)
          .set({
            ...payload,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, entityId));
        applied.push(entityId);

        // Check if this task is associated with a ticket and trigger completion check
        const updatedTask = existingTask[0];
        if (updatedTask.ticketId) {
          // Trigger ticket completion check asynchronously (don't await to avoid blocking)
          fetch(
            `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/support/check-completion`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ticketId: updatedTask.ticketId }),
            }
          ).catch((err) =>
            console.error('Failed to check ticket completion:', err)
          );
        }
      }
    }
  } else if (action === 'delete') {
    if (existingTask.length > 0) {
      await db.delete(tasks).where(eq(tasks.id, entityId));
      applied.push(entityId);
    }
  }
}

async function processProjectOp(
  entityId: string,
  action: string,
  payload: any,
  baseVersion: number | undefined,
  applied: string[],
  conflicts: any[]
) {
  const existingProject = await db
    .select()
    .from(projects)
    .where(eq(projects.id, entityId))
    .limit(1);

  if (action === 'create') {
    if (existingProject.length > 0) {
      // Conflict: project already exists
      conflicts.push({
        entityType: 'project',
        entityId,
        local: payload,
        remote: existingProject[0],
        reason: 'already_exists',
      });
    } else {
      // Create new project
      await db.insert(projects).values({
        id: entityId,
        ...payload,
        updatedAt: new Date(),
      });
      applied.push(entityId);
    }
  } else if (action === 'update') {
    if (existingProject.length === 0) {
      // Conflict: project doesn't exist
      conflicts.push({
        entityType: 'project',
        entityId,
        local: payload,
        remote: null,
        reason: 'not_found',
      });
    } else {
      const currentProject = existingProject[0];
      // Check version conflict if baseVersion is provided
      if (
        baseVersion !== undefined &&
        currentProject.updatedAt.getTime() > baseVersion
      ) {
        conflicts.push({
          entityType: 'project',
          entityId,
          local: payload,
          remote: currentProject,
          reason: 'stale_version',
        });
      } else {
        // Update project
        await db
          .update(projects)
          .set({
            ...payload,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, entityId));
        applied.push(entityId);
      }
    }
  } else if (action === 'delete') {
    if (existingProject.length > 0) {
      await db.delete(projects).where(eq(projects.id, entityId));
      applied.push(entityId);
    }
  }
}
