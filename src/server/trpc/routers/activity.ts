import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { activityLog } from '@/server/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export const activityRouter = createTRPCRouter({
  // Get activity feed with enhanced filtering
  getActivityFeed: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        taskId: z.string().optional(),
        actionType: z
          .enum([
            'created',
            'updated',
            'deleted',
            'assigned',
            'completed',
            'commented',
            'mentioned',
            'synced',
            'conflict_resolved',
          ])
          .optional(),
        targetType: z
          .enum(['task', 'project', 'comment', 'sync', 'system'])
          .optional(),
        dateRange: z.enum(['today', 'week', 'month', 'all']).default('all'),
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

      if (input.taskId) {
        whereConditions.push(eq(activityLog.taskId, input.taskId));
      }

      if (input.actionType) {
        whereConditions.push(eq(activityLog.action, input.actionType));
      }

      if (input.targetType) {
        whereConditions.push(eq(activityLog.targetType, input.targetType));
      }

      // Date range filtering
      if (input.dateRange !== 'all') {
        const now = new Date();
        let dateThreshold: Date;

        switch (input.dateRange) {
          case 'today':
            dateThreshold = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case 'week':
            dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateThreshold = new Date(0);
        }
        whereConditions.push(gte(activityLog.createdAt, dateThreshold));
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

  // Undo recent action (5-min window)
  undoAction: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the activity
      const activities = await db
        .select()
        .from(activityLog)
        .where(
          and(
            eq(activityLog.id, input.activityId),
            eq(activityLog.actorId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (activities.length === 0) {
        throw new Error('Activity not found');
      }

      const activity = activities[0];

      // Check if within 5-minute window
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (new Date(activity.createdAt) < fiveMinutesAgo) {
        throw new Error('Undo window expired (5 minutes)');
      }

      // Undo based on action type
      if (activity.action === 'deleted' && activity.targetType === 'task') {
        // Restore deleted task from payload
        if (activity.payload && activity.payload.task) {
          const { tasks } = await import('@/server/db/schema');
          await db
            .update(tasks)
            .set({
              archived: false,
              archivedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, activity.targetId!));
        }
      } else if (
        activity.action === 'updated' &&
        activity.targetType === 'task'
      ) {
        // Restore previous values from payload
        if (activity.payload && activity.payload.oldValues) {
          const { tasks } = await import('@/server/db/schema');
          await db
            .update(tasks)
            .set({
              ...activity.payload.oldValues,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, activity.targetId!));
        }
      } else if (
        activity.action === 'completed' &&
        activity.targetType === 'task'
      ) {
        // Mark task as not completed
        const { tasks } = await import('@/server/db/schema');
        await db
          .update(tasks)
          .set({
            status: activity.payload?.previousStatus || 'in_progress',
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, activity.targetId!));
      }

      // Delete the activity log entry
      await db.delete(activityLog).where(eq(activityLog.id, input.activityId));

      return { success: true };
    }),
});
