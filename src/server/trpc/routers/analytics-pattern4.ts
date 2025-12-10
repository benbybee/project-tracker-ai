import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { sprints, sprintWeeks, opportunities, tasks } from '@/server/db';
import { eq, and, asc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { addDays, format, differenceInDays } from 'date-fns';

export const analyticsPattern4Router = createTRPCRouter({
  getSprintTrends: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get sprint details
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

      // Get all tasks for sprint with creation and completion dates
      const sprintTasks = await ctx.db
        .select({
          id: tasks.id,
          status: tasks.status,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id)
          )
        );

      // Generate trend data
      // Group by day for the last 30 days or sprint duration
      const startDate = new Date(sprint.startDate);
      const endDate = new Date(); // Up to today
      const days = differenceInDays(endDate, startDate) + 1;

      const trendData = [];
      let cumulativeTotal = 0;
      let cumulativeCompleted = 0;

      // This is a simplified trend calculation
      // In a real app, you'd want more precise historical tracking
      // For now, we'll approximate based on created/updated timestamps
      for (let i = 0; i < Math.min(days, 90); i++) {
        const currentDate = addDays(startDate, i);
        const dateStr = format(currentDate, 'MMM d');

        // Count tasks created on or before this date
        const totalOnDate = sprintTasks.filter(
          (t) => new Date(t.createdAt) <= currentDate
        ).length;

        // Count tasks completed on or before this date
        const completedOnDate = sprintTasks.filter(
          (t) =>
            t.status === 'completed' && new Date(t.updatedAt) <= currentDate
        ).length;

        trendData.push({
          date: dateStr,
          total: totalOnDate,
          completed: completedOnDate,
          planned: Math.round(totalOnDate * ((i + 1) / 90)), // Rough planned line
        });
      }

      return trendData;
    }),

  getFinancialSummary: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      let oppQuery = ctx.db
        .select()
        .from(opportunities)
        .where(eq(opportunities.userId, ctx.session.user.id));

      if (input.sprintId) {
        oppQuery = oppQuery.where(
          and(
            eq(opportunities.userId, ctx.session.user.id),
            eq(opportunities.sprintId, input.sprintId)
          )
        );
      }

      const opps = await oppQuery;

      // Group by opportunity for chart data
      const chartData = opps
        .filter((o) => o.actualCost || o.estimatedCost || o.revenue)
        .map((o) => ({
          name: o.name,
          cost: parseFloat(o.actualCost || o.estimatedCost || '0'),
          revenue: parseFloat(o.revenue || '0'),
          profit: parseFloat(o.profit || '0'),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 by revenue

      // Calculate totals
      const totals = opps.reduce(
        (acc, o) => ({
          totalCost:
            acc.totalCost + parseFloat(o.actualCost || o.estimatedCost || '0'),
          totalRevenue: acc.totalRevenue + parseFloat(o.revenue || '0'),
          totalProfit: acc.totalProfit + parseFloat(o.profit || '0'),
        }),
        { totalCost: 0, totalRevenue: 0, totalProfit: 0 }
      );

      return {
        chartData,
        totals,
      };
    }),

  getOpportunityDistribution: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid().optional() }))
    .query(async ({ input, ctx }) => {
      let oppQuery = ctx.db
        .select()
        .from(opportunities)
        .where(eq(opportunities.userId, ctx.session.user.id));

      if (input.sprintId) {
        oppQuery = oppQuery.where(
          and(
            eq(opportunities.userId, ctx.session.user.id),
            eq(opportunities.sprintId, input.sprintId)
          )
        );
      }

      const opps = await oppQuery;

      // Distribution by Status
      const statusCounts: Record<string, number> = {};
      opps.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
        color: getStatusColor(name),
      }));

      // Distribution by Lane
      const laneCounts: Record<string, number> = {};
      opps.forEach((o) => {
        const lane = o.lane || 'Uncategorized';
        laneCounts[lane] = (laneCounts[lane] || 0) + 1;
      });

      const laneData = Object.entries(laneCounts).map(([name, value]) => ({
        name,
        value,
        color: getRandomColor(name),
      }));

      return {
        statusData,
        laneData,
      };
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

      const sprintTasks = await ctx.db
        .select({
          status: tasks.status,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, input.sprintId),
            eq(tasks.userId, ctx.session.user.id)
          )
        );

      const totalTasks = sprintTasks.length;
      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      const totalDays = 90;

      const burndownData = [];
      const now = new Date();

      for (let i = 0; i <= totalDays; i++) {
        const currentDate = addDays(startDate, i);
        const dayStr = format(currentDate, 'MMM d');

        // Ideal line
        const ideal = Math.max(0, totalTasks - totalTasks * (i / totalDays));

        // Actual remaining
        // Only calculate for past/present days
        let actual = 0;
        if (currentDate <= now) {
          const completedByDate = sprintTasks.filter(
            (t) =>
              t.status === 'completed' && new Date(t.updatedAt) <= currentDate
          ).length;
          actual = Math.max(0, totalTasks - completedByDate);
        }

        burndownData.push({
          day: dayStr,
          ideal: Math.round(ideal),
          actual: currentDate <= now ? actual : 0, // 0 prevents chart line from extending
        });
      }

      // Filter out future dates for 'actual' line in chart display logic usually
      // For Recharts Area, we might return null or handle in component

      return burndownData;
    }),

  getVelocityData: protectedProcedure
    .input(z.object({ sprintId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get weeks for sprint
      const weeks = await ctx.db
        .select()
        .from(sprintWeeks)
        .where(eq(sprintWeeks.sprintId, input.sprintId))
        .orderBy(sprintWeeks.weekIndex);

      const velocityData = [];
      let totalCompleted = 0;

      for (const week of weeks) {
        // Count completed tasks for this week's assignment
        // Note: Ideally we check completion date falling within week range
        // For simplicity using sprintWeekId assignment + status='completed'

        const completedTasks = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(
            and(
              eq(tasks.sprintWeekId, week.id),
              eq(tasks.userId, ctx.session.user.id),
              eq(tasks.status, 'completed')
            )
          );

        const count = Number(completedTasks[0]?.count || 0);
        totalCompleted += count;

        velocityData.push({
          week: `W${week.weekIndex}`,
          completed: count,
        });
      }

      const averageVelocity =
        weeks.length > 0
          ? Math.round((totalCompleted / weeks.length) * 10) / 10
          : 0;

      return {
        velocityData,
        averageVelocity,
      };
    }),
});

// Helpers
function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    IDEA: '#94a3b8',
    PLANNING: '#60a5fa',
    ACTIVE: '#4ade80',
    ON_HOLD: '#fbbf24',
    COMPLETED: '#a78bfa',
    KILLED: '#f87171',
  };
  return map[status] || '#94a3b8';
}

function getRandomColor(str: string): string {
  const colors = [
    '#60a5fa',
    '#4ade80',
    '#fbbf24',
    '#f87171',
    '#a78bfa',
    '#2dd4bf',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
