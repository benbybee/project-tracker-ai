import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  sprints,
  sprintWeeks,
  opportunities,
  tasks,
} from '@/server/db';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { differenceInDays, startOfDay, endOfDay, addDays, format } from 'date-fns';

export const analyticsPattern4Router = createTRPCRouter({
  getSprintTrends: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [sprint] = await ctx.db
        .select()
        .from(sprints)
        .where(
          and(
            eq(sprints.id, input.sprintId),
            eq(sprints.userId, ctx.session.user.id)
          )
        );

      if (!sprint) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sprint not found',
        });
      }

      // Get all tasks in sprint
      const sprintTasks = await ctx.db
        .select({
          status: tasks.status,
          updatedAt: tasks.updatedAt,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id)
          )
        );

      // Generate trend data by week
      const weeks = [];
      let currentDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      let weekCount = 1;

      while (currentDate <= endDate) {
        const weekStart = startOfDay(currentDate);
        const weekEnd = endOfDay(addDays(currentDate, 6));

        // Tasks created before or during this week
        const tasksInScope = sprintTasks.filter(
          (t) => new Date(t.createdAt) <= weekEnd
        );

        // Tasks completed by end of this week
        const completedCount = tasksInScope.filter(
          (t) =>
            t.status === 'completed' && new Date(t.updatedAt) <= weekEnd
        ).length;

        // Ideal progress (linear)
        const totalDuration = differenceInDays(endDate, new Date(sprint.startDate));
        const daysElapsed = differenceInDays(weekEnd, new Date(sprint.startDate));
        const progressPercent = Math.min(100, Math.round((daysElapsed / totalDuration) * 100));

        // Actual progress
        const totalCount = Math.max(tasksInScope.length, 1);
        const actualPercent = Math.round((completedCount / totalCount) * 100);

        weeks.push({
          name: `Week ${weekCount}`,
          actual: actualPercent,
          planned: progressPercent,
        });

        currentDate = addDays(currentDate, 7);
        weekCount++;
      }

      return weeks;
    }),

  getFinancialSummary: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      let query = ctx.db
        .select()
        .from(opportunities)
        .where(eq(opportunities.userId, ctx.session.user.id));

      if (input.sprintId) {
        query = query.where(
          and(
            eq(opportunities.userId, ctx.session.user.id),
            eq(opportunities.sprintId, input.sprintId)
          )
        );
      }

      const opps = await query;

      return opps.map((opp) => ({
        name: opp.name,
        cost: parseFloat(opp.actualCost || opp.estimatedCost || '0'),
        revenue: parseFloat(opp.revenue || '0'),
        profit: parseFloat(opp.profit || '0'),
      })).filter(item => item.cost > 0 || item.revenue > 0);
    }),

  getOpportunityDistribution: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      let query = ctx.db
        .select()
        .from(opportunities)
        .where(eq(opportunities.userId, ctx.session.user.id));

      if (input.sprintId) {
        query = query.where(
          and(
            eq(opportunities.userId, ctx.session.user.id),
            eq(opportunities.sprintId, input.sprintId)
          )
        );
      }

      const opps = await query;

      // By Status
      const statusData = [
        'IDEA',
        'PLANNING',
        'ACTIVE',
        'ON_HOLD',
        'COMPLETED',
        'KILLED',
      ].map((status) => ({
        name: status,
        value: opps.filter((o) => o.status === status).length,
      })).filter(d => d.value > 0);

      // By Lane
      const laneMap = new Map<string, number>();
      opps.forEach((o) => {
        if (o.lane) {
          laneMap.set(o.lane, (laneMap.get(o.lane) || 0) + 1);
        }
      });
      const laneData = Array.from(laneMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      // By Type
      const typeData = [
        { name: 'MAJOR', value: opps.filter((o) => o.type === 'MAJOR').length },
        { name: 'MICRO', value: opps.filter((o) => o.type === 'MICRO').length },
      ].filter(d => d.value > 0);

      return { statusData, laneData, typeData };
    }),

  getBurndownData: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [sprint] = await ctx.db
        .select()
        .from(sprints)
        .where(
          and(
            eq(sprints.id, input.sprintId),
            eq(sprints.userId, ctx.session.user.id)
          )
        );

      if (!sprint) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sprint not found',
        });
      }

      const sprintTasks = await ctx.db
        .select({
          status: tasks.status,
          updatedAt: tasks.updatedAt,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id)
          )
        );

      const totalTasks = sprintTasks.length;
      const data = [];
      let currentDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      const today = new Date();

      // Calculate daily burn
      while (currentDate <= endDate) {
        // Stop calculating future actuals
        if (currentDate > today) break;

        const dayEnd = endOfDay(currentDate);
        
        // Tasks completed by this day
        const completedCount = sprintTasks.filter(
          (t) => t.status === 'completed' && new Date(t.updatedAt) <= dayEnd
        ).length;

        // Remaining
        const remaining = Math.max(0, totalTasks - completedCount);

        // Ideal line
        const totalDuration = differenceInDays(endDate, new Date(sprint.startDate));
        const daysElapsed = differenceInDays(currentDate, new Date(sprint.startDate));
        const ideal = Math.max(0, totalTasks - (totalTasks * (daysElapsed / totalDuration)));

        data.push({
          day: format(currentDate, 'MMM d'),
          actual: remaining,
          ideal: Math.round(ideal),
        });

        currentDate = addDays(currentDate, 1);
      }

      // Fill future ideal line
      while (currentDate <= endDate) {
        const totalDuration = differenceInDays(endDate, new Date(sprint.startDate));
        const daysElapsed = differenceInDays(currentDate, new Date(sprint.startDate));
        const ideal = Math.max(0, totalTasks - (totalTasks * (daysElapsed / totalDuration)));

        data.push({
          day: format(currentDate, 'MMM d'),
          actual: null as any, // Null for future actuals
          ideal: Math.round(ideal),
        });
        currentDate = addDays(currentDate, 1);
      }

      return data;
    }),

  getVelocityData: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [sprint] = await ctx.db
        .select()
        .from(sprints)
        .where(
          and(
            eq(sprints.id, input.sprintId),
            eq(sprints.userId, ctx.session.user.id)
          )
        );

      if (!sprint) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sprint not found',
        });
      }

      const sprintTasks = await ctx.db
        .select({
          status: tasks.status,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id),
            eq(tasks.status, 'completed')
          )
        );

      const weeks = [];
      let currentDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      let weekCount = 1;
      let totalCompleted = 0;

      while (currentDate <= endDate) {
        const weekStart = startOfDay(currentDate);
        const weekEnd = endOfDay(addDays(currentDate, 6));

        // Tasks completed this week
        const weeklyCompleted = sprintTasks.filter(
          (t) => {
            const completedAt = new Date(t.updatedAt);
            return completedAt >= weekStart && completedAt <= weekEnd;
          }
        ).length;

        weeks.push({
          week: `Week ${weekCount}`,
          completed: weeklyCompleted,
        });

        totalCompleted += weeklyCompleted;
        currentDate = addDays(currentDate, 7);
        weekCount++;
      }

      // Calculate average velocity (excluding future weeks if 0)
      const activeWeeks = weeks.filter(w => w.completed > 0).length;
      const averageVelocity = activeWeeks > 0 
        ? Math.round((totalCompleted / activeWeeks) * 10) / 10 
        : 0;

      return {
        data: weeks,
        averageVelocity,
      };
    }),
});
