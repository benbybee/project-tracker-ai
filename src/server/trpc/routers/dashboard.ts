import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { projects, tasks, roles } from '@/server/db';
import { eq, and, sql, isNotNull, lt, gte, lte, desc } from 'drizzle-orm';

export const dashboardRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        roleId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      // Build filter conditions - always start with non-archived tasks
      const projectConditions = [];
      if (input.roleId) {
        projectConditions.push(eq(projects.roleId, input.roleId));
      }

      // Get projects with task counts (sorted by pinned DESC, then updatedAt DESC)
      // Only count non-archived tasks
      const projectsWithCounts = await ctx.db
        .select({
          id: projects.id,
          name: projects.name,
          type: projects.type,
          roleId: projects.roleId,
          pinned: projects.pinned,
          updatedAt: projects.updatedAt,
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
          totalTasks:
            sql<number>`count(case when ${tasks.archived} = false OR ${tasks.archived} IS NULL then ${tasks.id} end)`.as(
              'totalTasks'
            ),
          completedTasks: sql<number>`
            count(case when ${tasks.status} = 'completed' AND (${tasks.archived} = false OR ${tasks.archived} IS NULL) then 1 end)
          `.as('completedTasks'),
        })
        .from(projects)
        .leftJoin(tasks, eq(projects.id, tasks.projectId))
        .leftJoin(roles, eq(projects.roleId, roles.id))
        .where(
          projectConditions.length > 0 ? and(...projectConditions) : sql`1=1`
        )
        .groupBy(projects.id, roles.id)
        .orderBy(desc(projects.pinned), desc(projects.updatedAt));

      // Get today's tasks count (exclude archived)
      const todayTasks = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.dueDate, todayStr),
            sql`${tasks.status} != 'completed'`,
            sql`(${tasks.archived} = false OR ${tasks.archived} IS NULL)`,
            input.roleId ? eq(tasks.roleId, input.roleId) : sql`1=1`
          )
        );

      // Get overdue tasks count (exclude archived)
      const overdueTasks = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            isNotNull(tasks.dueDate),
            lt(tasks.dueDate, todayStr),
            sql`${tasks.status} != 'completed'`,
            sql`(${tasks.archived} = false OR ${tasks.archived} IS NULL)`,
            input.roleId ? eq(tasks.roleId, input.roleId) : sql`1=1`
          )
        );

      // Get upcoming tasks (next 7 days, limit 5, exclude archived)
      const upcomingTasks = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          dueDate: tasks.dueDate,
          priorityScore: tasks.priorityScore,
          projectId: tasks.projectId,
          roleId: tasks.roleId,
          project: {
            id: projects.id,
            name: projects.name,
            type: projects.type,
          },
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(roles, eq(tasks.roleId, roles.id))
        .where(
          and(
            isNotNull(tasks.dueDate),
            gte(tasks.dueDate, todayStr),
            lte(tasks.dueDate, nextWeekStr),
            sql`${tasks.status} != 'completed'`,
            sql`(${tasks.archived} = false OR ${tasks.archived} IS NULL)`,
            input.roleId ? eq(tasks.roleId, input.roleId) : sql`1=1`
          )
        )
        .orderBy(tasks.dueDate)
        .limit(5);

      // Get next 3 days tasks
      const next3Days = new Date();
      next3Days.setDate(next3Days.getDate() + 3);
      const next3DaysStr = next3Days.toISOString().split('T')[0];

      const next3DaysTasks = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          dueDate: tasks.dueDate,
          priorityScore: tasks.priorityScore,
          projectId: tasks.projectId,
          roleId: tasks.roleId,
          updatedAt: tasks.updatedAt,
          project: {
            id: projects.id,
            name: projects.name,
            type: projects.type,
          },
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(roles, eq(tasks.roleId, roles.id))
        .where(
          and(
            isNotNull(tasks.dueDate),
            gte(tasks.dueDate, todayStr),
            lt(tasks.dueDate, next3DaysStr),
            sql`${tasks.status} != 'completed'`,
            sql`(${tasks.archived} = false OR ${tasks.archived} IS NULL)`,
            input.roleId ? eq(tasks.roleId, input.roleId) : sql`1=1`
          )
        )
        .orderBy(tasks.dueDate);

      // Get next 7 days tasks (days 4-7)
      const next7DaysTasks = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          dueDate: tasks.dueDate,
          priorityScore: tasks.priorityScore,
          projectId: tasks.projectId,
          roleId: tasks.roleId,
          updatedAt: tasks.updatedAt,
          project: {
            id: projects.id,
            name: projects.name,
            type: projects.type,
          },
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(roles, eq(tasks.roleId, roles.id))
        .where(
          and(
            isNotNull(tasks.dueDate),
            gte(tasks.dueDate, next3DaysStr),
            lte(tasks.dueDate, nextWeekStr),
            sql`${tasks.status} != 'completed'`,
            sql`(${tasks.archived} = false OR ${tasks.archived} IS NULL)`,
            input.roleId ? eq(tasks.roleId, input.roleId) : sql`1=1`
          )
        )
        .orderBy(tasks.dueDate);

      // Get blocked/stagnant tasks
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const blockedStagnantTasks = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          dueDate: tasks.dueDate,
          priorityScore: tasks.priorityScore,
          projectId: tasks.projectId,
          roleId: tasks.roleId,
          updatedAt: tasks.updatedAt,
          project: {
            id: projects.id,
            name: projects.name,
            type: projects.type,
          },
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(roles, eq(tasks.roleId, roles.id))
        .where(
          and(
            sql`${tasks.status} != 'completed'`,
            sql`(${tasks.archived} = false OR ${tasks.archived} IS NULL)`,
            sql`(${tasks.status} = 'blocked' OR ${tasks.updatedAt} < ${sevenDaysAgo.toISOString()})`,
            input.roleId ? eq(tasks.roleId, input.roleId) : sql`1=1`
          )
        )
        .orderBy(tasks.updatedAt);

      return {
        projects: projectsWithCounts.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          roleId: p.roleId,
          role: p.role,
          pinned: p.pinned ?? false,
          totalTasks: Number(p.totalTasks),
          completedTasks: Number(p.completedTasks),
        })),
        today: Number(todayTasks[0]?.count || 0),
        overdue: Number(overdueTasks[0]?.count || 0),
        upcoming: upcomingTasks.map((task) => ({
          ...task,
          dueDate: task.dueDate ?? null,
          updatedAt: task.updatedAt?.toISOString() ?? null,
        })),
        next3Days: next3DaysTasks.map((task) => ({
          ...task,
          dueDate: task.dueDate ?? null,
          updatedAt: task.updatedAt?.toISOString() ?? null,
        })),
        next7Days: next7DaysTasks.map((task) => ({
          ...task,
          dueDate: task.dueDate ?? null,
          updatedAt: task.updatedAt?.toISOString() ?? null,
        })),
        blockedStagnant: blockedStagnantTasks.map((task) => ({
          ...task,
          dueDate: task.dueDate ?? null,
          updatedAt: task.updatedAt?.toISOString() ?? null,
        })),
      };
    }),
});
