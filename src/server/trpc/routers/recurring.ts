import { z } from 'zod';
import { protectedProcedure, createTRPCRouter } from '../trpc';
import { tasks } from '@/server/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  getNextOccurrence,
  getNextOccurrences,
  configToRRule,
  rruleToConfig,
  getRecurrenceDescription,
} from '@/lib/recurrence-parser';

/**
 * Recurring Tasks Router
 * Handles recurring task logic, next occurrence generation, and management
 */

const recurrenceConfigSchema = z.object({
  pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  interval: z.number().min(1).default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  monthlyType: z.enum(['date', 'relative']).optional(),
  relativeDayOfWeek: z.number().min(0).max(6).optional(),
  relativeWeekOfMonth: z
    .union([z.number().min(1).max(4), z.literal(-1)])
    .optional(),
  skipWeekends: z.boolean().optional(),
  endType: z.enum(['never', 'after', 'byDate']),
  occurrenceCount: z.number().min(1).optional(),
  endDate: z.string().optional(), // ISO date string
});

export const recurringRouter = createTRPCRouter({
  /**
   * Get all recurring tasks for the current user
   */
  listRecurringTasks: protectedProcedure.query(async ({ ctx }) => {
    const recurringTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, ctx.session.user.id),
        eq(tasks.isRecurring, true),
        eq(tasks.archived, false)
      ),
      with: {
        project: true,
        role: true,
      },
    });

    // Add recurrence description to each task
    return recurringTasks.map((task) => {
      let description = '';
      if (task.recurrenceRule) {
        const config = rruleToConfig(task.recurrenceRule as string);
        description = config ? getRecurrenceDescription(config) : '';
      }
      return {
        ...task,
        recurrenceDescription: description,
      };
    });
  }),

  /**
   * Create a recurring task
   */
  createRecurringTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        title: z.string().min(2),
        description: z.string().optional(),
        roleId: z.string().uuid().optional(),
        priorityScore: z.enum(['1', '2', '3', '4']).default('2'),
        startDate: z.string(), // ISO date string - when first occurrence starts
        recurrenceConfig: recurrenceConfigSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);

      // Convert config to RRULE
      const config = {
        ...input.recurrenceConfig,
        endDate: input.recurrenceConfig.endDate
          ? new Date(input.recurrenceConfig.endDate)
          : undefined,
      };
      const rruleString = configToRRule(config, startDate);

      // Calculate next occurrence
      const nextOccurrence = getNextOccurrence(rruleString, new Date());

      // Create the recurring task
      const [task] = await db
        .insert(tasks)
        .values({
          userId: ctx.session.user.id,
          projectId: input.projectId,
          roleId: input.roleId,
          title: input.title,
          description: input.description,
          priorityScore: input.priorityScore,
          status: 'not_started',
          isRecurring: true,
          recurrenceRule: JSON.stringify(rruleString),
          nextOccurrence: nextOccurrence
            ? nextOccurrence.toISOString().split('T')[0]
            : null,
          dueDate: nextOccurrence
            ? nextOccurrence.toISOString().split('T')[0]
            : null,
        })
        .returning();

      return task;
    }),

  /**
   * Update recurrence settings for a task
   */
  updateRecurrence: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        recurrenceConfig: recurrenceConfigSchema,
        startDate: z.string().optional(),
        updateFutureOccurrences: z.boolean().default(false), // If true, update all future occurrences
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the existing task
      const existingTask = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.id, input.taskId),
          eq(tasks.userId, ctx.session.user.id)
        ),
      });

      if (!existingTask) {
        throw new Error('Task not found');
      }

      const startDate = input.startDate
        ? new Date(input.startDate)
        : new Date();
      const config = {
        ...input.recurrenceConfig,
        endDate: input.recurrenceConfig.endDate
          ? new Date(input.recurrenceConfig.endDate)
          : undefined,
      };
      const rruleString = configToRRule(config, startDate);
      const nextOccurrence = getNextOccurrence(rruleString, new Date());

      // Update the task
      const [updated] = await db
        .update(tasks)
        .set({
          isRecurring: true,
          recurrenceRule: JSON.stringify(rruleString),
          nextOccurrence: nextOccurrence
            ? nextOccurrence.toISOString().split('T')[0]
            : null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(tasks.id, input.taskId), eq(tasks.userId, ctx.session.user.id))
        )
        .returning();

      return updated;
    }),

  /**
   * Remove recurrence from a task (make it a regular task)
   */
  removeRecurrence: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(tasks)
        .set({
          isRecurring: false,
          recurrenceRule: null,
          recurrenceParentId: null,
          nextOccurrence: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(tasks.id, input.taskId), eq(tasks.userId, ctx.session.user.id))
        )
        .returning();

      if (!updated) {
        throw new Error('Task not found');
      }

      return updated;
    }),

  /**
   * Generate the next occurrence of a recurring task
   * Called when a task is completed to create the next instance
   */
  generateNextOccurrence: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the recurring parent task
      const parentTask = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.id, input.taskId),
          eq(tasks.userId, ctx.session.user.id),
          eq(tasks.isRecurring, true)
        ),
      });

      if (!parentTask || !parentTask.recurrenceRule) {
        throw new Error('Not a recurring task');
      }

      const rruleString = parentTask.recurrenceRule as string;

      // Get the next occurrence date
      const nextDate = getNextOccurrence(rruleString, new Date());

      if (!nextDate) {
        // No more occurrences (end date reached or count limit hit)
        return { hasMore: false };
      }

      // Create a new task instance for the next occurrence
      const [newTask] = await db
        .insert(tasks)
        .values({
          userId: ctx.session.user.id,
          projectId: parentTask.projectId,
          roleId: parentTask.roleId,
          title: parentTask.title,
          description: parentTask.description,
          priorityScore: parentTask.priorityScore,
          status: 'not_started',
          isRecurring: false, // The occurrence itself is not recurring
          recurrenceParentId: parentTask.id,
          dueDate: nextDate.toISOString().split('T')[0],
        })
        .returning();

      // Update the parent task's next occurrence
      const afterNext = getNextOccurrence(rruleString, nextDate);
      await db
        .update(tasks)
        .set({
          nextOccurrence: afterNext
            ? afterNext.toISOString().split('T')[0]
            : null,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, parentTask.id));

      return {
        hasMore: !!afterNext,
        nextTask: newTask,
        nextDate: afterNext,
      };
    }),

  /**
   * Batch generate upcoming occurrences for all recurring tasks
   * Can be run via cron job to pre-generate tasks
   */
  generateUpcomingOccurrences: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(90).default(30), // Generate for next 30 days
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get all recurring tasks
      const recurringTasks = await db.query.tasks.findMany({
        where: and(
          eq(tasks.userId, ctx.session.user.id),
          eq(tasks.isRecurring, true),
          eq(tasks.archived, false),
          isNotNull(tasks.recurrenceRule)
        ),
      });

      const today = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + input.daysAhead);

      const results = [];

      for (const task of recurringTasks) {
        const rruleString = task.recurrenceRule as string;

        // Get next occurrence date
        const nextOccurrenceDate = task.nextOccurrence
          ? new Date(task.nextOccurrence)
          : getNextOccurrence(rruleString, today);

        // If next occurrence is within our window, generate it
        if (nextOccurrenceDate && nextOccurrenceDate <= endDate) {
          // Check if an occurrence already exists for this date
          const existing = await db.query.tasks.findFirst({
            where: and(
              eq(tasks.recurrenceParentId, task.id),
              eq(tasks.dueDate, nextOccurrenceDate.toISOString().split('T')[0])
            ),
          });

          if (!existing) {
            // Create the occurrence
            const [newTask] = await db
              .insert(tasks)
              .values({
                userId: ctx.session.user.id,
                projectId: task.projectId,
                roleId: task.roleId,
                title: task.title,
                description: task.description,
                priorityScore: task.priorityScore,
                status: 'not_started',
                isRecurring: false,
                recurrenceParentId: task.id,
                dueDate: nextOccurrenceDate.toISOString().split('T')[0],
              })
              .returning();

            results.push({
              parentTaskId: task.id,
              occurrenceTaskId: newTask.id,
              dueDate: nextOccurrenceDate,
            });

            // Update parent's next occurrence
            const afterNext = getNextOccurrence(
              rruleString,
              nextOccurrenceDate
            );
            await db
              .update(tasks)
              .set({
                nextOccurrence: afterNext
                  ? afterNext.toISOString().split('T')[0]
                  : null,
                updatedAt: new Date(),
              })
              .where(eq(tasks.id, task.id));
          }
        }
      }

      return {
        generated: results.length,
        occurrences: results,
      };
    }),

  /**
   * Get preview of upcoming occurrences for a recurrence config
   * Useful for showing users what the recurrence will look like
   */
  previewOccurrences: protectedProcedure
    .input(
      z.object({
        recurrenceConfig: recurrenceConfigSchema,
        startDate: z.string(),
        count: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.startDate);
      const config = {
        ...input.recurrenceConfig,
        endDate: input.recurrenceConfig.endDate
          ? new Date(input.recurrenceConfig.endDate)
          : undefined,
      };
      const rruleString = configToRRule(config, startDate);

      const occurrences = getNextOccurrences(
        rruleString,
        input.count,
        startDate
      );
      const description = getRecurrenceDescription(config);

      return {
        description,
        occurrences: occurrences.map(
          (date) => date.toISOString().split('T')[0]
        ),
        rrule: rruleString,
      };
    }),

  /**
   * Skip the next occurrence of a recurring task
   */
  skipNextOccurrence: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.id, input.taskId),
          eq(tasks.userId, ctx.session.user.id),
          eq(tasks.isRecurring, true)
        ),
      });

      if (!task || !task.recurrenceRule) {
        throw new Error('Not a recurring task');
      }

      const rruleString = task.recurrenceRule as string;
      const currentNext = task.nextOccurrence
        ? new Date(task.nextOccurrence)
        : new Date();

      // Skip to the occurrence after the current next
      const afterNext = getNextOccurrence(rruleString, currentNext);

      await db
        .update(tasks)
        .set({
          nextOccurrence: afterNext
            ? afterNext.toISOString().split('T')[0]
            : null,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.taskId));

      return {
        skipped: currentNext,
        newNext: afterNext,
      };
    }),
});
