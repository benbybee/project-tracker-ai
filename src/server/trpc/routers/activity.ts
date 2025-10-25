import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { activityLog } from '@/server/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export const activityRouter = createTRPCRouter({
  // Get activity feed
  getActivityFeed: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
        since: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const whereConditions = [];

      if (input.projectId) {
        whereConditions.push(eq(activityLog.projectId, input.projectId));
      }

      if (input.since) {
        whereConditions.push(gte(activityLog.createdAt, input.since));
      }

      const activities = await db
        .select()
        .from(activityLog)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return activities;
    }),

  // Get user activity
  getUserActivity: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.session.user.id;

      const activities = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.actorId, userId))
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return activities;
    }),

  // Log activity (internal use)
  logActivity: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(['task', 'project', 'comment', 'sync', 'system']),
        targetId: z.string().optional(),
        action: z.enum([
          'created',
          'updated',
          'deleted',
          'assigned',
          'completed',
          'commented',
          'mentioned',
          'synced',
          'conflict_resolved',
        ]),
        payload: z.any().optional(),
        projectId: z.string().optional(),
        taskId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await db
        .insert(activityLog)
        .values({
          actorId: ctx.session.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          action: input.action,
          payload: input.payload,
          projectId: input.projectId,
          taskId: input.taskId,
        })
        .returning();

      return activity[0];
    }),
});
