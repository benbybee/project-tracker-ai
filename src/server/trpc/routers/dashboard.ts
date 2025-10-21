import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { projects, tasks, roles } from '@/server/db';
import { eq, and, sql, isNotNull, lt, gte, lte, or } from 'drizzle-orm';

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

      // Build role filter conditions
      const roleConditions = [];
      if (input.roleId) {
        roleConditions.push(eq(projects.roleId, input.roleId));
      }

      // Get projects with task counts
      const projectsWithCounts = await ctx.db
        .select({
          id: projects.id,
          name: projects.name,
          type: projects.type,
          roleId: projects.roleId,
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
          totalTasks: sql<number>`count(${tasks.id})`.as('totalTasks'),
          completedTasks: sql<number>`
            count(case when ${tasks.status} = 'completed' then 1 end)
          `.as('completedTasks'),
        })
        .from(projects)
        .leftJoin(tasks, eq(projects.id, tasks.projectId))
        .leftJoin(roles, eq(projects.roleId, roles.id))
        .where(
          roleConditions.length > 0 
            ? and(...roleConditions)
            : undefined
        )
        .groupBy(projects.id, roles.id);

      // Get today's tasks count
      const todayTasks = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.dueDate, todayStr),
            sql`${tasks.status} != 'completed'`,
            input.roleId ? eq(tasks.roleId, input.roleId) : undefined
          )
        );

      // Get overdue tasks count
      const overdueTasks = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            isNotNull(tasks.dueDate),
            lt(tasks.dueDate, todayStr),
            sql`${tasks.status} != 'completed'`,
            input.roleId ? eq(tasks.roleId, input.roleId) : undefined
          )
        );

      // Get upcoming tasks (next 7 days, limit 5)
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
            input.roleId ? eq(tasks.roleId, input.roleId) : undefined
          )
        )
        .orderBy(tasks.dueDate)
        .limit(5);

      return {
        projects: projectsWithCounts.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          roleId: p.roleId,
          role: p.role,
          totalTasks: Number(p.totalTasks),
          completedTasks: Number(p.completedTasks),
        })),
        today: Number(todayTasks[0]?.count || 0),
        overdue: Number(overdueTasks[0]?.count || 0),
        upcoming: upcomingTasks,
      };
    }),
});

