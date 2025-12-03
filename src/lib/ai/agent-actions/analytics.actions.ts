import { z } from 'zod';
import { db } from '@/server/db';
import { tasks, projects } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

const GetProjectStatsSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string().optional(),
});

export async function executeGetProjectStats(params: {
  userId: string;
  projectId?: string;
  projectName?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = GetProjectStatsSchema.parse(params);

    let projectId = validated.projectId;

    // If project name provided, look up ID
    if (!projectId && validated.projectName) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, params.userId))
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

    // Verify ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, params.userId))
      )
      .limit(1);

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Get task statistics
    const [taskStats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} IN ('in_progress', 'in-progress'))`,
        notStarted: sql<number>`count(*) filter (where ${tasks.status} IN ('not_started', 'not-completed'))`,
        blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`,
        overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          eq(tasks.userId, params.userId),
          eq(tasks.archived, false)
        )
      );

    const completionRate =
      taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

    return {
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          type: project.type,
          description: project.description,
        },
        stats: {
          totalTasks: Number(taskStats.total),
          completed: Number(taskStats.completed),
          inProgress: Number(taskStats.inProgress),
          notStarted: Number(taskStats.notStarted),
          blocked: Number(taskStats.blocked),
          overdue: Number(taskStats.overdue),
          completionRate: completionRate,
        },
      },
    };
  } catch (error: any) {
    console.error('[AnalyticsActions] Get project stats error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get project stats',
    };
  }
}

export async function executeGenerateReport(params: {
  userId: string;
  type: 'daily' | 'weekly' | 'monthly';
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const today = new Date();
    let startDate = new Date();

    if (params.type === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (params.type === 'weekly') {
      startDate.setDate(today.getDate() - 7);
    } else if (params.type === 'monthly') {
      startDate.setMonth(today.getMonth() - 1);
    }

    const startDateStr = startDate.toISOString();

    // Get task statistics for the period
    const [taskStats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        created: sql<number>`count(*) filter (where ${tasks.createdAt} >= ${startDateStr})`,
        completedInPeriod: sql<number>`count(*) filter (where ${tasks.status} = 'completed' AND ${tasks.updatedAt} >= ${startDateStr})`,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, params.userId), eq(tasks.archived, false)));

    // Get project count
    const [projectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, params.userId));

    return {
      success: true,
      data: {
        period: params.type,
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        summary: {
          totalTasks: Number(taskStats.total),
          completedTasks: Number(taskStats.completed),
          tasksCreated: Number(taskStats.created),
          tasksCompletedInPeriod: Number(taskStats.completedInPeriod),
          activeProjects: Number(projectCount.count),
        },
        report: `${params.type.toUpperCase()} REPORT\n\nPeriod: ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}\n\nTasks created: ${taskStats.created}\nTasks completed: ${taskStats.completedInPeriod}\nTotal active tasks: ${taskStats.total}\nActive projects: ${projectCount.count}`,
      },
    };
  } catch (error: any) {
    console.error('[AnalyticsActions] Generate report error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate report',
    };
  }
}
