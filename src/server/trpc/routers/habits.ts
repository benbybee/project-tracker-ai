import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { habits, habitLogs } from '@/server/db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const HabitCreate = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly']),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
});

export const habitsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userHabits = await ctx.db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, ctx.session.user.id), eq(habits.archived, false)))
        .orderBy(desc(habits.createdAt));

      return userHabits;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch habits',
        cause: error,
      });
    }
  }),

  create: protectedProcedure.input(HabitCreate).mutation(async ({ input, ctx }) => {
    const [newHabit] = await ctx.db
      .insert(habits)
      .values({
        userId: ctx.session.user.id,
        title: input.title,
        description: input.description,
        frequency: input.frequency,
        timeOfDay: input.timeOfDay,
      })
      .returning();

    return newHabit;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        frequency: z.enum(['daily', 'weekly']).optional(),
        timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
        archived: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const [updatedHabit] = await ctx.db
        .update(habits)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, ctx.session.user.id)))
        .returning();

      if (!updatedHabit) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Habit not found',
        });
      }

      return updatedHabit;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedHabit] = await ctx.db
        .delete(habits)
        .where(and(eq(habits.id, input.id), eq(habits.userId, ctx.session.user.id)))
        .returning();

      if (!deletedHabit) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Habit not found',
        });
      }

      return deletedHabit;
    }),

  getLogs: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
      })
    )
    .query(async ({ input, ctx }) => {
      // We need to join with habits to ensure we only get logs for the user's habits
      const logs = await ctx.db
        .select({
          id: habitLogs.id,
          habitId: habitLogs.habitId,
          completedDate: habitLogs.completedDate,
          notes: habitLogs.notes,
        })
        .from(habitLogs)
        .innerJoin(habits, eq(habitLogs.habitId, habits.id))
        .where(
          and(
            eq(habits.userId, ctx.session.user.id),
            gte(habitLogs.completedDate, input.startDate),
            lte(habitLogs.completedDate, input.endDate)
          )
        );

      return logs;
    }),

  toggleCompletion: protectedProcedure
    .input(
      z.object({
        habitId: z.string().uuid(),
        date: z.string(), // YYYY-MM-DD
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify habit belongs to user
      const habit = await ctx.db.query.habits.findFirst({
        where: and(eq(habits.id, input.habitId), eq(habits.userId, ctx.session.user.id)),
      });

      if (!habit) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Habit not found',
        });
      }

      // Check if log exists
      const existingLog = await ctx.db.query.habitLogs.findFirst({
        where: and(
          eq(habitLogs.habitId, input.habitId),
          eq(habitLogs.completedDate, input.date)
        ),
      });

      if (existingLog) {
        // Remove log (uncomplete)
        await ctx.db.delete(habitLogs).where(eq(habitLogs.id, existingLog.id));
        return { completed: false };
      } else {
        // Create log (complete)
        await ctx.db.insert(habitLogs).values({
          habitId: input.habitId,
          completedDate: input.date,
        });
        return { completed: true };
      }
    }),
});

