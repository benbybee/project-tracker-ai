import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { sprints, sprintWeeks, opportunities, tasks } from '@/server/db';
import { eq, and, desc, asc, isNotNull, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  differenceInDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from 'date-fns';

export const analyticsPattern4Router = createTRPCRouter({
  getSprintTrends: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // 1. Get sprint dates
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

      // 2. Get all weeks for this sprint
      const weeks = await ctx.db
        .select()
        .from(sprintWeeks)
        .where(eq(sprintWeeks.sprintId, input.sprintId))
        .orderBy(asc(sprintWeeks.weekIndex));

      // 3. For each week, calculate completed vs total tasks
      const trendData = [];
      
      // Get all tasks for this sprint first
      const allTasks = await ctx.db
        .select({
          id: tasks.id,
          status: tasks.status,
          sprintWeekId: tasks.sprintWeekId,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id)
          )
        );

      for (const week of weeks) {
        const weekTasks = allTasks.filter(
          (t) => t.sprintWeekId === week.id
        );
        
        trendData.push({
          date: `Week ${week.weekIndex}`,
          completed: weekTasks.filter((t) => t.status === 'completed').length,
          total: weekTasks.length,
          label: week.theme || `Week ${week.weekIndex}`,
        });
      }

      return trendData;
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

      const summaryData = opps
        .filter((o) => o.status === 'COMPLETED' || o.estimatedCost)
        .map((o) => ({
          name: o.name,
          cost: parseFloat(o.actualCost || o.estimatedCost || '0'),
          revenue: parseFloat(o.revenue || '0'),
          profit: parseFloat(o.profit || '0'),
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10); // Top 10 by profit

      return summaryData;
    }),

  getOpportunityDistribution: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      let query = ctx.db
        .select({
          status: opportunities.status,
          type: opportunities.type,
          lane: opportunities.lane,
        })
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
      const statusCounts: Record<string, number> = {};
      opps.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const statusData = Object.entries(statusCounts).map(([name, value]) => {
        let color = '#94a3b8';
        if (name === 'IDEA') color = '#94a3b8';
        if (name === 'PLANNING') color = '#3b82f6';
        if (name === 'ACTIVE') color = '#22c55e';
        if (name === 'ON_HOLD') color = '#eab308';
        if (name === 'COMPLETED') color = '#a855f7';
        if (name === 'KILLED') color = '#ef4444';

        return { name, value, color };
      });

      // By Lane
      const laneCounts: Record<string, number> = {};
      opps.forEach((o) => {
        const lane = o.lane || 'Uncategorized';
        laneCounts[lane] = (laneCounts[lane] || 0) + 1;
      });

      const laneData = Object.entries(laneCounts)
        .map(([name, value]) => ({
          name,
          value,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color for now
        }))
        .sort((a, b) => b.value - a.value);

      return { statusData, laneData };
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

      if (!sprint) throw new TRPCError({ code: 'NOT_FOUND' });

      const allTasks = await ctx.db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id)
          )
        );

      const totalTasks = allTasks.length;
      const sprintStart = parseISO(sprint.startDate);
      const sprintEnd = parseISO(sprint.endDate);
      const days = differenceInDays(sprintEnd, sprintStart);
      const idealBurnPerDay = totalTasks / days;

      const data = [];
      const interval = eachDayOfInterval({ start: sprintStart, end: new Date() });

      // Only go up to today or sprint end, whichever is earlier
      const chartEndDate = new Date() > sprintEnd ? sprintEnd : new Date();
      
      let currentDay = 0;
      for (const date of interval) {
        if (date > chartEndDate) break;
        
        // Count tasks completed ON or BEFORE this date
        // Note: This is an approximation as we don't track completionDate perfectly
        // We use updatedAt for completed tasks as a proxy
        const completedCount = allTasks.filter(
          (t) =>
            t.status === 'completed' &&
            t.updatedAt <= date
        ).length;

        data.push({
          day: format(date, 'MMM d'),
          remaining: totalTasks - completedCount,
          ideal: Math.max(0, totalTasks - (idealBurnPerDay * currentDay)),
        });
        currentDay++;
      }

      return data;
    }),

  getVelocityData: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const weeks = await ctx.db
        .select()
        .from(sprintWeeks)
        .where(eq(sprintWeeks.sprintId, input.sprintId))
        .orderBy(asc(sprintWeeks.weekIndex));

      const allTasks = await ctx.db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id),
            eq(tasks.status, 'completed')
          )
        );

      const data = [];
      let totalCompleted = 0;

      for (const week of weeks) {
        // Count completed tasks associated with this week
        // OR completed during this week's date range
        const weekStart = parseISO(week.startDate);
        const weekEnd = parseISO(week.endDate);

        const completedInWeek = allTasks.filter(
          (t) => {
            // Task is assigned to this week OR completed during this week
            const completedAt = t.updatedAt;
            return (
              t.sprintWeekId === week.id ||
              (completedAt >= weekStart && completedAt <= weekEnd)
            );
          }
        ).length;

        data.push({
          week: `Week ${week.weekIndex}`,
          completed: completedInWeek,
        });
        
        totalCompleted += completedInWeek;
      }

      // Calculate average (excluding current/future weeks with 0 if possible, but simpler to avg all so far)
      const weeksWithData = data.filter(d => d.completed > 0).length || 1;
      const averageVelocity = totalCompleted / weeksWithData;

      return { data, averageVelocity };
    }),
});

