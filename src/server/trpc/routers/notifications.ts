import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { notifications, notificationSettings, tasks } from '@/server/db/schema';
import { eq, desc, and, sql, isNull } from 'drizzle-orm';

export const notificationsRouter = createTRPCRouter({
  // Get user notifications with grouping support
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        unreadOnly: z.boolean().default(false),
        grouped: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(notifications.userId, ctx.session.user.id)];

      if (input.unreadOnly) {
        whereConditions.push(eq(notifications.read, false));
      }

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(...whereConditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Group notifications if requested
      if (input.grouped) {
        const grouped = new Map<string, any[]>();
        const ungrouped: any[] = [];

        userNotifications.forEach((notif) => {
          if (notif.groupKey) {
            if (!grouped.has(notif.groupKey)) {
              grouped.set(notif.groupKey, []);
            }
            grouped.get(notif.groupKey)!.push(notif);
          } else {
            ungrouped.push(notif);
          }
        });

        return {
          grouped: Array.from(grouped.entries()).map(([key, items]) => ({
            groupKey: key,
            count: items.length,
            latest: items[0],
            items,
          })),
          ungrouped,
        };
      }

      return userNotifications;
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notifications)
        .set({
          read: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id)
          )
        );

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({
        read: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.read, false)
        )
      );

    return { success: true };
  }),

  // Delete notification
  deleteNotification: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id)
          )
        );

      return { success: true };
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.read, false)
        )
      );

    return result.length;
  }),

  // Execute notification action (Complete, Snooze, etc.)
  executeAction: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
        actionType: z.enum(['complete', 'snooze', 'view']),
        taskId: z.string().optional(),
        snoozeDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Mark notification as read and record action taken
      await db
        .update(notifications)
        .set({
          read: true,
          actionTaken: input.actionType,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.session.user.id)
          )
        );

      // Execute the actual action
      if (input.actionType === 'complete' && input.taskId) {
        await db
          .update(tasks)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tasks.id, input.taskId),
              eq(tasks.userId, ctx.session.user.id)
            )
          );
      } else if (input.actionType === 'snooze' && input.taskId && input.snoozeDays) {
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + input.snoozeDays);

        await db
          .update(tasks)
          .set({
            dueDate: newDueDate.toISOString().split('T')[0],
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tasks.id, input.taskId),
              eq(tasks.userId, ctx.session.user.id)
            )
          );
      }

      return { success: true };
    }),

  // Create notification (internal use)
  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum([
          'task_assigned',
          'task_updated',
          'task_completed',
          'project_updated',
          'comment_added',
          'mention',
          'sync_conflict',
          'collaboration',
          'task_reminder',
          'due_date_approaching',
          'ai_suggestion',
        ]),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
        metadata: z.any().optional(),
        actions: z.any().optional(),
        groupKey: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const notification = await db
        .insert(notifications)
        .values({
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          metadata: input.metadata,
          actions: input.actions,
          groupKey: input.groupKey,
        })
        .returning();

      return notification[0];
    }),

  // ============= NOTIFICATION SETTINGS =============

  // Get user notification settings
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, ctx.session.user.id))
      .limit(1);

    // Return default settings if none exist
    if (settings.length === 0) {
      return {
        userId: ctx.session.user.id,
        typePreferences: {
          task_reminder: true,
          due_date_approaching: true,
          task_assigned: true,
          task_updated: true,
          task_completed: true,
          project_updated: true,
          comment_added: true,
          mention: true,
          sync_conflict: true,
          collaboration: true,
          ai_suggestion: true,
        },
        emailEnabled: false,
        emailFrequency: 'never' as const,
        emailDigestTime: 8,
        pushEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: 22,
        quietHoursEnd: 8,
        soundEnabled: true,
        soundType: 'default',
      };
    }

    return settings[0];
  }),

  // Update notification settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        typePreferences: z.record(z.boolean()).optional(),
        emailEnabled: z.boolean().optional(),
        emailFrequency: z.enum(['realtime', 'daily', 'weekly', 'never']).optional(),
        emailDigestTime: z.number().min(0).max(23).optional(),
        pushEnabled: z.boolean().optional(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.number().min(0).max(23).optional(),
        quietHoursEnd: z.number().min(0).max(23).optional(),
        soundEnabled: z.boolean().optional(),
        soundType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if settings exist
      const existing = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, ctx.session.user.id))
        .limit(1);

      if (existing.length === 0) {
        // Create new settings
        const newSettings = await db
          .insert(notificationSettings)
          .values({
            userId: ctx.session.user.id,
            ...input,
          })
          .returning();

        return newSettings[0];
      } else {
        // Update existing settings
        const updated = await db
          .update(notificationSettings)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(notificationSettings.userId, ctx.session.user.id))
          .returning();

        return updated[0];
      }
    }),
});
