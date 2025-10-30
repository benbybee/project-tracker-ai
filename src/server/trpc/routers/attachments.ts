/**
 * tRPC Router: Attachments
 * Handles file attachment CRUD operations for tasks
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { taskAttachments, tasks } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { del } from '@vercel/blob';

/**
 * List all attachments for a task
 */
export const attachmentsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user owns the task
      const task = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)),
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Fetch attachments
      const attachmentList = await db.query.taskAttachments.findMany({
        where: eq(taskAttachments.taskId, input.taskId),
        orderBy: [desc(taskAttachments.createdAt)],
      });

      return attachmentList;
    }),

  /**
   * Get single attachment by ID
   */
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const attachment = await db.query.taskAttachments.findFirst({
        where: eq(taskAttachments.id, input.id),
        with: {
          task: true,
        },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found',
        });
      }

      // Verify user owns the task
      if (attachment.task.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this attachment',
        });
      }

      return attachment;
    }),

  /**
   * Create attachment metadata (called after file upload)
   */
  create: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        fileName: z.string().min(1),
        fileSize: z.number().int().positive(),
        mimeType: z.string().min(1),
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user owns the task
      const task = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)),
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Check attachment count limit (10 per task)
      const existingCount = await db
        .select()
        .from(taskAttachments)
        .where(eq(taskAttachments.taskId, input.taskId));

      if (existingCount.length >= 10) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum 10 attachments per task',
        });
      }

      // Create attachment record
      const [attachment] = await db
        .insert(taskAttachments)
        .values({
          taskId: input.taskId,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          url: input.url,
          thumbnailUrl: input.thumbnailUrl || null,
          uploadedBy: userId,
        })
        .returning();

      return attachment;
    }),

  /**
   * Delete attachment (removes file from Vercel Blob and DB record)
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Fetch attachment with task info
      const attachment = await db.query.taskAttachments.findFirst({
        where: eq(taskAttachments.id, input.id),
        with: {
          task: true,
        },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found',
        });
      }

      // Verify user owns the task
      if (attachment.task.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this attachment',
        });
      }

      // Delete from Vercel Blob
      try {
        await del(attachment.url);
        
        // Delete thumbnail if exists
        if (attachment.thumbnailUrl) {
          await del(attachment.thumbnailUrl);
        }
      } catch (error) {
        console.error('Failed to delete file from Vercel Blob:', error);
        // Continue with DB deletion even if Blob deletion fails
      }

      // Delete from database
      await db.delete(taskAttachments).where(eq(taskAttachments.id, input.id));

      return { success: true };
    }),

  /**
   * Get total attachment size for a task
   */
  getTotalSize: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user owns the task
      const task = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)),
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const attachmentList = await db
        .select()
        .from(taskAttachments)
        .where(eq(taskAttachments.taskId, input.taskId));

      const totalSize = attachmentList.reduce((sum, att) => sum + Number(att.fileSize), 0);

      return {
        count: attachmentList.length,
        totalSize,
      };
    }),
});

