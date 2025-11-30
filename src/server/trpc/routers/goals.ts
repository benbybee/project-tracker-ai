import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { goals, projects } from '@/server/db';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const GoalCreate = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'career',
    'health',
    'finance',
    'personal',
    'learning',
    'other',
  ]),
  targetDate: z.string().optional(), // YYYY-MM-DD
  projectId: z.string().uuid().optional(),
});

export const goalsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userGoals = await ctx.db
        .select({
          id: goals.id,
          title: goals.title,
          description: goals.description,
          category: goals.category,
          targetDate: goals.targetDate,
          status: goals.status,
          progress: goals.progress,
          projectId: goals.projectId,
          projectName: projects.name,
          createdAt: goals.createdAt,
          updatedAt: goals.updatedAt,
        })
        .from(goals)
        .leftJoin(projects, eq(goals.projectId, projects.id))
        .where(eq(goals.userId, ctx.session.user.id))
        .orderBy(desc(goals.createdAt));

      return userGoals;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch goals',
        cause: error,
      });
    }
  }),

  create: protectedProcedure
    .input(GoalCreate)
    .mutation(async ({ input, ctx }) => {
      const [newGoal] = await ctx.db
        .insert(goals)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          targetDate: input.targetDate,
          projectId: input.projectId,
        })
        .returning();

      return newGoal;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z
          .enum([
            'career',
            'health',
            'finance',
            'personal',
            'learning',
            'other',
          ])
          .optional(),
        targetDate: z.string().optional(),
        status: z
          .enum(['not_started', 'in_progress', 'completed', 'on_hold'])
          .optional(),
        progress: z.number().min(0).max(100).optional(),
        projectId: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const [updatedGoal] = await ctx.db
        .update(goals)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(goals.id, id), eq(goals.userId, ctx.session.user.id)))
        .returning();

      if (!updatedGoal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Goal not found',
        });
      }

      return updatedGoal;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedGoal] = await ctx.db
        .delete(goals)
        .where(
          and(eq(goals.id, input.id), eq(goals.userId, ctx.session.user.id))
        )
        .returning();

      if (!deletedGoal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Goal not found',
        });
      }

      return deletedGoal;
    }),
});
