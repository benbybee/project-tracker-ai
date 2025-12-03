import { z } from 'zod';
import { db } from '@/server/db';
import { tasks, projects } from '@/server/db/schema';
import { eq, like, or, lte, and } from 'drizzle-orm';
import { upsertEmbedding } from '@/server/search/upsertEmbedding';
import { logTaskActivity } from '@/lib/activity-logger';

const CreateTaskSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  priorityScore: z.enum(['1', '2', '3', '4']).optional(),
  dueDate: z.string().optional(),
  status: z
    .enum(['not_started', 'in_progress', 'blocked', 'completed'])
    .optional(),
});

const UpdateTaskSchema = z.object({
  taskId: z.string(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z
    .enum(['not_started', 'in_progress', 'blocked', 'completed'])
    .optional(),
  priorityScore: z.enum(['1', '2', '3', '4']).optional(),
  dueDate: z.string().optional(),
});

const DeleteTaskSchema = z.object({
  taskId: z.string(),
});

const SearchTasksSchema = z.object({
  query: z.string().optional(),
  status: z
    .enum(['not_started', 'in_progress', 'blocked', 'completed'])
    .optional(),
  projectId: z.string().optional(),
  overdue: z.boolean().optional(),
});

const ChangeTaskStatusSchema = z.object({
  taskId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'completed']),
  blockedReason: z.string().optional(),
});

export async function executeCreateTask(params: {
  userId: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description?: string;
  priorityScore?: '1' | '2' | '3' | '4';
  dueDate?: string;
  status?: 'not_started' | 'in_progress' | 'blocked' | 'completed';
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = CreateTaskSchema.parse(params);

    let projectId = validated.projectId;

    // If project name provided, look up ID
    if (!projectId && validated.projectName) {
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.userId, params.userId),
            like(projects.name, `%${validated.projectName}%`)
          )
        )
        .limit(1);

      if (project) {
        projectId = project.id;
      } else {
        return {
          success: false,
          error: `Project "${validated.projectName}" not found`,
        };
      }
    }

    if (!projectId) {
      return { success: false, error: 'Project ID or name required' };
    }

    // Get project's default role
    const [project] = await db
      .select({ roleId: projects.roleId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const [task] = await db
      .insert(tasks)
      .values({
        userId: params.userId,
        projectId: projectId,
        roleId: project?.roleId || null,
        title: validated.title,
        description: validated.description || '',
        status: validated.status || 'not_started',
        priorityScore: validated.priorityScore || '2',
        dueDate: validated.dueDate || null,
      })
      .returning();

    // Create embedding for search
    await upsertEmbedding({
      entityType: 'task',
      entityId: task.id,
      text: [task.title, task.description || ''].join('\n'),
    });

    // Log activity
    await logTaskActivity({
      userId: params.userId,
      taskId: task.id,
      taskTitle: task.title,
      action: 'created',
      projectId: task.projectId,
    });

    return { success: true, data: task };
  } catch (error: any) {
    console.error('[TaskActions] Create task error:', error);
    return { success: false, error: error.message || 'Failed to create task' };
  }
}

export async function executeUpdateTask(params: {
  userId: string;
  taskId: string;
  title?: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'blocked' | 'completed';
  priorityScore?: '1' | '2' | '3' | '4';
  dueDate?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = UpdateTaskSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, validated.taskId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Task not found' };
    }

    if (existing.userId !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const [updated] = await db
      .update(tasks)
      .set({
        title: validated.title || existing.title,
        description: validated.description || existing.description,
        status: validated.status || existing.status,
        priorityScore: validated.priorityScore || existing.priorityScore,
        dueDate: validated.dueDate || existing.dueDate,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, validated.taskId))
      .returning();

    // Update embedding
    await upsertEmbedding({
      entityType: 'task',
      entityId: updated.id,
      text: [updated.title, updated.description || ''].join('\n'),
    });

    // Log activity
    await logTaskActivity({
      userId: params.userId,
      taskId: updated.id,
      taskTitle: updated.title,
      action: 'updated',
      projectId: updated.projectId,
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('[TaskActions] Update task error:', error);
    return { success: false, error: error.message || 'Failed to update task' };
  }
}

export async function executeDeleteTask(params: {
  userId: string;
  taskId: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = DeleteTaskSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, validated.taskId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Task not found' };
    }

    if (existing.userId !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.delete(tasks).where(eq(tasks.id, validated.taskId));

    // Log activity
    await logTaskActivity({
      userId: params.userId,
      taskId: existing.id,
      taskTitle: existing.title,
      action: 'deleted',
      projectId: existing.projectId,
    });

    return {
      success: true,
      data: { message: `Task "${existing.title}" deleted successfully` },
    };
  } catch (error: any) {
    console.error('[TaskActions] Delete task error:', error);
    return { success: false, error: error.message || 'Failed to delete task' };
  }
}

export async function executeSearchTasks(params: {
  userId: string;
  query?: string;
  status?: 'not_started' | 'in_progress' | 'blocked' | 'completed';
  projectId?: string;
  overdue?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = SearchTasksSchema.parse(params);

    const conditions = [
      eq(tasks.userId, params.userId),
      eq(tasks.archived, false),
    ];

    if (validated.query) {
      conditions.push(
        or(
          like(tasks.title, `%${validated.query}%`),
          like(tasks.description, `%${validated.query}%`)
        ) as any
      );
    }

    if (validated.status) {
      conditions.push(eq(tasks.status, validated.status));
    }

    if (validated.projectId) {
      conditions.push(eq(tasks.projectId, validated.projectId));
    }

    if (validated.overdue) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(lte(tasks.dueDate, today) as any);
    }

    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions));

    return { success: true, data: results };
  } catch (error: any) {
    console.error('[TaskActions] Search tasks error:', error);
    return { success: false, error: error.message || 'Failed to search tasks' };
  }
}

export async function executeChangeTaskStatus(params: {
  userId: string;
  taskId: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed';
  blockedReason?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = ChangeTaskStatusSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, validated.taskId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Task not found' };
    }

    if (existing.userId !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const updateData: any = {
      status: validated.status,
      updatedAt: new Date(),
    };

    if (validated.status === 'blocked') {
      updateData.blockedReason = validated.blockedReason || 'Blocked';
      updateData.blockedAt = new Date();
    }

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, validated.taskId))
      .returning();

    // Log activity
    await logTaskActivity({
      userId: params.userId,
      taskId: updated.id,
      taskTitle: updated.title,
      action: 'updated',
      projectId: updated.projectId,
      payload: { status: updated.status },
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('[TaskActions] Change status error:', error);
    return {
      success: false,
      error: error.message || 'Failed to change task status',
    };
  }
}

export async function executeGetTaskSummary(params: {
  userId: string;
  status?: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'overdue';
  projectId?: string;
  dueWithinDays?: number;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const conditions = [
      eq(tasks.userId, params.userId),
      eq(tasks.archived, false),
    ];

    if (params.status && params.status !== 'overdue') {
      conditions.push(eq(tasks.status, params.status));
    }

    if (params.status === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(
        and(
          lte(tasks.dueDate, today) as any,
          eq(tasks.status, 'not_started')
        ) as any
      );
    }

    if (params.projectId) {
      conditions.push(eq(tasks.projectId, params.projectId));
    }

    if (params.dueWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + params.dueWithinDays);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      conditions.push(lte(tasks.dueDate, futureDateStr) as any);
    }

    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions));

    return {
      success: true,
      data: {
        count: results.length,
        tasks: results,
        summary: `Found ${results.length} tasks matching criteria`,
      },
    };
  } catch (error: any) {
    console.error('[TaskActions] Get summary error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get task summary',
    };
  }
}
