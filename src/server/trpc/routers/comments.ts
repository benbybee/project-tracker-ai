import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { taskComments, tasks } from '@/server/db/schema';
import { emitIdeaForgeTaskWebhook } from '@/lib/ideaforge-webhook';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';

export const commentsRouter = createTRPCRouter({
  // Get comments for a task
  getComments: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await db
        .select()
        .from(tasks)
        .where(
          and(eq(tasks.id, input.taskId), eq(tasks.userId, ctx.session.user.id))
        )
        .limit(1);

      if (task.length === 0) {
        throw new Error('Task not found or access denied');
      }

      const comments = await db
        .select()
        .from(taskComments)
        .where(eq(taskComments.taskId, input.taskId))
        .orderBy(desc(taskComments.isPinned), desc(taskComments.createdAt));

      return comments;
    }),

  // Create comment
  createComment: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        content: z.string().min(1).max(10000),
        contentHtml: z.string().optional(),
        attachments: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await db
        .select()
        .from(tasks)
        .where(
          and(eq(tasks.id, input.taskId), eq(tasks.userId, ctx.session.user.id))
        )
        .limit(1);

      if (task.length === 0) {
        throw new Error('Task not found or access denied');
      }

      const comment = await db
        .insert(taskComments)
        .values({
          taskId: input.taskId,
          userId: ctx.session.user.id,
          content: input.content,
          contentHtml: input.contentHtml,
          attachments: input.attachments,
        })
        .returning();

      await emitIdeaForgeTaskWebhook(
        {
          type: 'task.note_added',
          taskId: input.taskId,
          userId: ctx.session.user.id,
          data: {
            commentId: comment[0]?.id,
            content: input.content,
            source: 'app',
          },
        },
        'task_app'
      );

      return comment[0];
    }),

  // Update comment
  updateComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(10000).optional(),
        contentHtml: z.string().optional(),
        attachments: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify comment ownership
      const existing = await db
        .select()
        .from(taskComments)
        .where(
          and(
            eq(taskComments.id, input.id),
            eq(taskComments.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error('Comment not found or access denied');
      }

      const updated = await db
        .update(taskComments)
        .set({
          content: input.content,
          contentHtml: input.contentHtml,
          attachments: input.attachments,
          isEdited: true,
          editedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(taskComments.id, input.id))
        .returning();

      return updated[0];
    }),

  // Delete comment
  deleteComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify comment ownership
      const existing = await db
        .select()
        .from(taskComments)
        .where(
          and(
            eq(taskComments.id, input.id),
            eq(taskComments.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error('Comment not found or access denied');
      }

      await db.delete(taskComments).where(eq(taskComments.id, input.id));

      return { success: true };
    }),

  // Pin/unpin comment
  togglePin: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isPinned: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify comment ownership (can pin any comment on owned task)
      const comment = await db
        .select({
          comment: taskComments,
          task: tasks,
        })
        .from(taskComments)
        .leftJoin(tasks, eq(taskComments.taskId, tasks.id))
        .where(eq(taskComments.id, input.id))
        .limit(1);

      if (
        comment.length === 0 ||
        comment[0].task?.userId !== ctx.session.user.id
      ) {
        throw new Error('Comment not found or access denied');
      }

      const updated = await db
        .update(taskComments)
        .set({
          isPinned: input.isPinned,
          updatedAt: new Date(),
        })
        .where(eq(taskComments.id, input.id))
        .returning();

      return updated[0];
    }),

  // Add reaction to comment
  addReaction: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        emoji: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await db
        .select()
        .from(taskComments)
        .where(eq(taskComments.id, input.commentId))
        .limit(1);

      if (comment.length === 0) {
        throw new Error('Comment not found');
      }

      const reactions = (comment[0].reactions as any[]) || [];

      // Check if user already reacted with this emoji
      const existingIndex = reactions.findIndex(
        (r: any) => r.userId === ctx.session.user.id && r.emoji === input.emoji
      );

      if (existingIndex >= 0) {
        // Remove reaction if already exists
        reactions.splice(existingIndex, 1);
      } else {
        // Add new reaction
        reactions.push({
          emoji: input.emoji,
          userId: ctx.session.user.id,
        });
      }

      const updated = await db
        .update(taskComments)
        .set({
          reactions: reactions,
          updatedAt: new Date(),
        })
        .where(eq(taskComments.id, input.commentId))
        .returning();

      return updated[0];
    }),

  // Search comments across all tasks
  searchComments: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Search in user's comments
      const comments = await db
        .select({
          comment: taskComments,
          task: tasks,
        })
        .from(taskComments)
        .leftJoin(tasks, eq(taskComments.taskId, tasks.id))
        .where(
          and(
            eq(tasks.userId, ctx.session.user.id),
            or(
              like(taskComments.content, `%${input.query}%`),
              sql`${taskComments.contentHtml} ILIKE ${`%${input.query}%`}`
            )
          )
        )
        .orderBy(desc(taskComments.createdAt))
        .limit(input.limit);

      return comments.map((c) => ({
        ...c.comment,
        task: c.task,
      }));
    }),

  // Get comment count for a task
  getCommentCount: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await db
        .select({ count: taskComments.id })
        .from(taskComments)
        .where(eq(taskComments.taskId, input.taskId));

      return result.length;
    }),
});
