import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { notifications } from '@/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const notificationsRouter = createTRPCRouter({
  // Get user notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        unreadOnly: z.boolean().default(false),
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
        ]),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
        metadata: z.any().optional(),
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
        })
        .returning();

      return notification[0];
    }),
});
