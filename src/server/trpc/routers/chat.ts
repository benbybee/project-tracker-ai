import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { threads, messages, messageReactions, threadParticipants } from '@/server/db/schema';
import { eq, desc, and, gte, count, sql } from 'drizzle-orm';

export const chatRouter = createTRPCRouter({
  // Get threads for a project
  getThreads: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const projectThreads = await db
        .select()
        .from(threads)
        .where(eq(threads.projectId, input.projectId))
        .orderBy(desc(threads.lastMessageAt))
        .limit(input.limit)
        .offset(input.offset);

      return projectThreads;
    }),

  // Get messages for a thread
  getThreadMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        limit: z.number().default(50),
        offset: z.number().default(0),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const whereConditions = [eq(messages.threadId, input.threadId)];
      
      if (input.cursor) {
        whereConditions.push(sql`${messages.createdAt} < ${input.cursor}`);
      }

      const threadMessages = await db
        .select()
        .from(messages)
        .where(and(...whereConditions))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return threadMessages.reverse(); // Return in chronological order
    }),

  // Create a new thread
  createThread: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        taskId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        participantIds: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const thread = await db
        .insert(threads)
        .values({
          projectId: input.projectId,
          taskId: input.taskId,
          title: input.title,
          description: input.description,
        })
        .returning();

      // Add current user as participant
      await db.insert(threadParticipants).values({
        threadId: thread[0].id,
        userId: ctx.session.user.id,
      });

      // Add other participants
      if (input.participantIds.length > 0) {
        await db.insert(threadParticipants).values(
          input.participantIds.map(userId => ({
            threadId: thread[0].id,
            userId,
          }))
        );
      }

      return thread[0];
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        content: z.string(),
        messageType: z.enum(['text', 'system', 'mention', 'reaction']).default('text'),
        metadata: z.any().optional(),
        replyToId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const message = await db
        .insert(messages)
        .values({
          threadId: input.threadId,
          userId: ctx.session.user.id,
          content: input.content,
          messageType: input.messageType,
          metadata: input.metadata,
          replyToId: input.replyToId,
        })
        .returning();

      // Update thread's last message timestamp and count
      await db
        .update(threads)
        .set({
          lastMessageAt: new Date(),
          messageCount: sql`${threads.messageCount} + 1`,
        })
        .where(eq(threads.id, input.threadId));

      return message[0];
    }),

  // Add reaction to message
  addReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        emoji: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already reacted with this emoji
      const existingReaction = await db
        .select()
        .from(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, input.messageId),
            eq(messageReactions.userId, ctx.session.user.id),
            eq(messageReactions.emoji, input.emoji)
          )
        )
        .limit(1);

      if (existingReaction.length > 0) {
        // Remove existing reaction
        await db
          .delete(messageReactions)
          .where(
            and(
              eq(messageReactions.messageId, input.messageId),
              eq(messageReactions.userId, ctx.session.user.id),
              eq(messageReactions.emoji, input.emoji)
            )
          );
        return { action: 'removed' };
      } else {
        // Add new reaction
        const reaction = await db
          .insert(messageReactions)
          .values({
            messageId: input.messageId,
            userId: ctx.session.user.id,
            emoji: input.emoji,
          })
          .returning();
        return { action: 'added', reaction: reaction[0] };
      }
    }),

  // Mark thread as read
  markThreadRead: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(threadParticipants)
        .set({
          lastReadAt: new Date(),
        })
        .where(
          and(
            eq(threadParticipants.threadId, input.threadId),
            eq(threadParticipants.userId, ctx.session.user.id)
          )
        );

      return { success: true };
    }),

  // Get unread message count for user
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const result = await db
        .select({ count: count() })
        .from(threadParticipants)
        .where(
          and(
            eq(threadParticipants.userId, ctx.session.user.id),
            sql`${threadParticipants.lastReadAt} < ${threads.lastMessageAt}`
          )
        )
        .leftJoin(threads, eq(threadParticipants.threadId, threads.id));

      return result[0]?.count || 0;
    }),

  // Get thread participants
  getThreadParticipants: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input }) => {
      const participants = await db
        .select()
        .from(threadParticipants)
        .where(eq(threadParticipants.threadId, input.threadId));

      return participants;
    }),

  // Add participant to thread
  addParticipant: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const participant = await db
        .insert(threadParticipants)
        .values({
          threadId: input.threadId,
          userId: input.userId,
        })
        .returning();

      return participant[0];
    }),
});
