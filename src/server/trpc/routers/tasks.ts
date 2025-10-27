import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import {
  tasks,
  projects,
  roles,
  subtasks,
  tickets,
  taskAnalytics,
} from '@/server/db';
import { eq, and, gte, lte, isNotNull, asc, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { upsertEmbedding } from '@/server/search/upsertEmbedding';
import { logTaskActivity } from '@/lib/activity-logger';

// Helper function to track task time automatically
async function trackTaskTime(
  taskId: string,
  userId: string,
  oldStatus: string | undefined,
  newStatus: string
) {
  // Start tracking when task moves to in_progress
  if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
    await db.insert(taskAnalytics).values({
      taskId,
      userId,
      startedAt: new Date(),
    });
  }

  // Record completion when task is completed
  if (newStatus === 'completed' && oldStatus !== 'completed') {
    // Find the most recent started record for this task
    const [latestRecord] = await db
      .select()
      .from(taskAnalytics)
      .where(
        and(eq(taskAnalytics.taskId, taskId), eq(taskAnalytics.userId, userId))
      )
      .orderBy(desc(taskAnalytics.createdAt))
      .limit(1);

    const completedAt = new Date();

    if (latestRecord && latestRecord.startedAt) {
      // Update existing record with completion time
      const durationMs =
        completedAt.getTime() - latestRecord.startedAt.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      await db
        .update(taskAnalytics)
        .set({
          completedAt,
          actualDurationMinutes: durationMinutes,
        })
        .where(eq(taskAnalytics.id, latestRecord.id));
    } else {
      // Create new completion record without start time
      await db.insert(taskAnalytics).values({
        taskId,
        userId,
        completedAt,
      });
    }
  }
}

const StatusEnum = z.enum([
  'not_started',
  'in_progress',
  'blocked',
  'completed',
  'content',
  'design',
  'dev',
  'qa',
  'launch',
]);

const PriorityEnum = z.enum(['1', '2', '3', '4']);

const TaskCreateSchema = z.object({
  projectId: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  // dueDate can be null if "Add to Daily" (no date)
  dueDate: z.string().nullable().optional(),
  isDaily: z.boolean().optional(),
  priorityScore: z.enum(['1', '2', '3', '4']).default('2'),
  status: StatusEnum.default('not_started'),
  roleId: z.string().optional(), // inherit from project if missing
  subtasks: z
    .array(
      z.object({
        title: z.string().min(1),
        completed: z.boolean().default(false),
        position: z.number().optional(),
      })
    )
    .optional(),
});

const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  id: z.string(),
});

export const tasksRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        status: z
          .enum([
            'not_started',
            'in_progress',
            'blocked',
            'completed',
            'content',
            'design',
            'dev',
            'qa',
            'launch',
          ])
          .optional(),
        roleId: z.string().optional(),
        dueWithinDays: z.number().optional(),
        isDailyOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const conditions = [];

      if (input.projectId) {
        conditions.push(eq(tasks.projectId, input.projectId));
      }

      if (input.status) {
        conditions.push(eq(tasks.status, input.status));
      }

      if (input.roleId) {
        conditions.push(eq(tasks.roleId, input.roleId));
      }

      if (input.dueWithinDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + input.dueWithinDays);
        conditions.push(
          and(
            isNotNull(tasks.dueDate),
            lte(tasks.dueDate, futureDate.toISOString().split('T')[0])
          )!
        );
      }

      if (input.isDailyOnly) {
        conditions.push(eq(tasks.isDaily, true));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      return await ctx.db
        .select({
          id: tasks.id,
          projectId: tasks.projectId,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          weekOf: tasks.weekOf,
          progress: tasks.progress,
          dueDate: tasks.dueDate,
          isDaily: tasks.isDaily,
          priorityScore: tasks.priorityScore,
          blockedReason: tasks.blockedReason,
          blockedDetails: tasks.blockedDetails,
          blockedAt: tasks.blockedAt,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          ticketId: tasks.ticketId,
          project: {
            id: projects.id,
            name: projects.name,
            type: projects.type,
          },
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
          ticket: {
            id: tickets.id,
            status: tickets.status,
          },
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(roles, eq(tasks.roleId, roles.id))
        .leftJoin(tickets, eq(tasks.ticketId, tickets.id))
        .where(whereClause || eq(tasks.id, tasks.id))
        .orderBy(tasks.createdAt);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [task] = await ctx.db
        .select({
          id: tasks.id,
          projectId: tasks.projectId,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          weekOf: tasks.weekOf,
          progress: tasks.progress,
          dueDate: tasks.dueDate,
          isDaily: tasks.isDaily,
          priorityScore: tasks.priorityScore,
          blockedReason: tasks.blockedReason,
          blockedDetails: tasks.blockedDetails,
          blockedAt: tasks.blockedAt,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          project: {
            id: projects.id,
            name: projects.name,
            type: projects.type,
          },
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(roles, eq(tasks.roleId, roles.id))
        .where(eq(tasks.id, input.id))
        .limit(1);

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      return task;
    }),

  create: protectedProcedure
    .input(TaskCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // Inherit role from project if none provided
      let roleId = input.roleId ?? null;
      if (!roleId) {
        const [proj] = await ctx.db
          .select({ roleId: projects.roleId })
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);
        roleId = proj?.roleId ?? null;
      }

      const [inserted] = await ctx.db
        .insert(tasks)
        .values({
          projectId: input.projectId,
          roleId: roleId,
          title: input.title,
          description: input.description ?? '',
          status: input.status,
          // dueDate: allow null for "Add to Daily"
          dueDate: input.dueDate ? input.dueDate : null,
          isDaily: input.isDaily ?? false,
          priorityScore: input.priorityScore,
        })
        .returning();

      if (input.subtasks?.length) {
        await ctx.db.insert(subtasks).values(
          input.subtasks.map((s, i) => ({
            taskId: inserted.id,
            title: s.title,
            completed: s.completed ?? false,
            position: s.position ?? i,
          }))
        );
      }

      // Create embedding for search
      await upsertEmbedding({
        entityType: 'task',
        entityId: inserted.id,
        text: [inserted.title, inserted.description ?? ''].join('\n'),
      });

      // Log activity
      await logTaskActivity({
        userId: ctx.session.user.id,
        taskId: inserted.id,
        taskTitle: inserted.title,
        action: 'created',
        projectId: inserted.projectId,
        payload: {
          status: inserted.status,
          priorityScore: inserted.priorityScore,
        },
      });

      return inserted;
    }),

  update: protectedProcedure
    .input(TaskUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...patch } = input;

      // Get current task state before updating
      const [currentTask] = await ctx.db
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      if (!currentTask) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const updateData: any = {};
      if (patch.title !== undefined) updateData.title = patch.title;
      if (patch.description !== undefined)
        updateData.description = patch.description;
      if (patch.status !== undefined) updateData.status = patch.status;
      if (patch.priorityScore !== undefined)
        updateData.priorityScore = patch.priorityScore;
      if (patch.isDaily !== undefined) updateData.isDaily = patch.isDaily;
      if ('dueDate' in patch)
        updateData.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
      if (patch.roleId !== undefined) updateData.roleId = patch.roleId;
      if (patch.projectId !== undefined) updateData.projectId = patch.projectId;

      const [updated] = await ctx.db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, id))
        .returning();

      // Track time if status changed
      if (patch.status !== undefined && patch.status !== currentTask.status) {
        await trackTaskTime(
          id,
          ctx.session.user.id,
          currentTask.status,
          patch.status
        );
      }

      // optional: upsert/replace subtasks if provided
      // (You can keep simple for now—handled via dedicated subtask endpoints)

      // Update embedding for search
      await upsertEmbedding({
        entityType: 'task',
        entityId: updated.id,
        text: [updated.title, updated.description ?? ''].join('\n'),
      });

      // Log activity - detect important changes
      const changedFields = Object.keys(updateData);
      const isStatusChange = changedFields.includes('status');
      const isCompletion = isStatusChange && updateData.status === 'completed';

      await logTaskActivity({
        userId: ctx.session.user.id,
        taskId: updated.id,
        taskTitle: updated.title,
        action: isCompletion ? 'completed' : 'updated',
        projectId: updated.projectId,
        payload: {
          changedFields,
          newStatus: updateData.status,
          ...updateData,
        },
      });

      return updated;
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        orderedIdsByStatus: z.record(z.array(z.string())),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updates = [];

      for (const [status, taskIds] of Object.entries(
        input.orderedIdsByStatus
      )) {
        for (let i = 0; i < taskIds.length; i++) {
          let whereClause = eq(tasks.id, taskIds[i]);

          // If projectId is provided, only update tasks in that project
          if (input.projectId) {
            whereClause = and(
              eq(tasks.id, taskIds[i]),
              eq(tasks.projectId, input.projectId)
            )!;
          }

          const updateQuery = ctx.db
            .update(tasks)
            .set({
              status: status as any,
              updatedAt: new Date(),
            })
            .where(whereClause);

          updates.push(updateQuery);
        }
      }

      await Promise.all(updates);
      return { success: true };
    }),

  setBlocked: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
        details: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [updatedTask] = await ctx.db
        .update(tasks)
        .set({
          status: 'blocked',
          blockedReason: input.reason,
          blockedDetails: input.details,
          blockedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.id))
        .returning();

      if (!updatedTask) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Log blocked activity with special notification
      await logTaskActivity({
        userId: ctx.session.user.id,
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        action: 'updated',
        projectId: updatedTask.projectId,
        payload: {
          blocked: true,
          reason: input.reason,
          details: input.details,
        },
      });

      return updatedTask;
    }),

  addSubtask: protectedProcedure
    .input(z.object({ taskId: z.string(), title: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const [st] = await ctx.db
        .insert(subtasks)
        .values({
          taskId: input.taskId,
          title: input.title,
          completed: false,
          position: 999, // will be normalized in reorder
        })
        .returning();
      return st;
    }),

  updateSubtask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        completed: z.boolean().optional(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const [updatedSubtask] = await ctx.db
        .update(subtasks)
        .set(updateData)
        .where(eq(subtasks.id, id))
        .returning();

      if (!updatedSubtask) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subtask not found',
        });
      }

      return updatedSubtask;
    }),

  deleteSubtask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedSubtask] = await ctx.db
        .delete(subtasks)
        .where(eq(subtasks.id, input.id))
        .returning();

      if (!deletedSubtask) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subtask not found',
        });
      }

      return deletedSubtask;
    }),

  moveToToday: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [row] = await ctx.db
        .update(tasks)
        .set({
          dueDate: today.toISOString().split('T')[0],
          isDaily: false,
        })
        .where(eq(tasks.id, input.id))
        .returning();
      return row;
    }),

  moveToNoDue: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db
        .update(tasks)
        .set({
          dueDate: null,
          isDaily: true,
        })
        .where(eq(tasks.id, input.id))
        .returning();
      return row;
    }),

  moveToNextDays: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        daysFromToday: z.number().min(1).max(3).default(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const target = new Date();
      target.setHours(0, 0, 0, 0);
      target.setDate(target.getDate() + input.daysFromToday);
      const [row] = await ctx.db
        .update(tasks)
        .set({
          dueDate: target.toISOString().split('T')[0],
          isDaily: false,
        })
        .where(eq(tasks.id, input.id))
        .returning();
      return row;
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Get current status for time tracking
      const [currentTask] = await ctx.db
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.id))
        .limit(1);

      const [row] = await ctx.db
        .update(tasks)
        .set({ status: 'completed' })
        .where(eq(tasks.id, input.id))
        .returning();

      // Track completion time
      if (row && currentTask) {
        await trackTaskTime(
          input.id,
          ctx.session.user.id,
          currentTask.status,
          'completed'
        );
      }

      // Log completion activity
      if (row) {
        await logTaskActivity({
          userId: ctx.session.user.id,
          taskId: row.id,
          taskTitle: row.title,
          action: 'completed',
          projectId: row.projectId,
          payload: { completedAt: new Date() },
        });
      }

      return row;
    }),

  snoozeDays: protectedProcedure
    .input(z.object({ id: z.string(), days: z.number().min(1).max(7) }))
    .mutation(async ({ input, ctx }) => {
      const target = new Date();
      target.setHours(0, 0, 0, 0);
      target.setDate(target.getDate() + input.days);
      const [row] = await ctx.db
        .update(tasks)
        .set({ dueDate: target.toISOString().split('T')[0], isDaily: false })
        .where(eq(tasks.id, input.id))
        .returning();
      return row;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db
        .delete(tasks)
        .where(eq(tasks.id, input.id))
        .returning();

      // Log deletion activity
      if (row) {
        await logTaskActivity({
          userId: ctx.session.user.id,
          taskId: row.id,
          taskTitle: row.title,
          action: 'deleted',
          projectId: row.projectId,
          payload: { deletedAt: new Date() },
        });
      }

      return row;
    }),

  byProjectId: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.tasks.findMany({
        where: eq(tasks.projectId, input.projectId),
        orderBy: [
          asc(tasks.status),
          asc(tasks.createdAt),
          desc(tasks.updatedAt),
        ],
        with: {
          subtasks: true,
          role: true,
        },
      });
    }),

  move: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        projectId: z.string().uuid(),
        status: z.enum([
          'not_started',
          'in_progress',
          'blocked',
          'completed',
          'content',
          'design',
          'dev',
          'qa',
          'launch',
        ]),
        // position: z.number().int().min(0), // Not implemented yet
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(tasks)
        .set({
          status: input.status,
          // position: input.position, // Not implemented yet
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, input.taskId));
      return { ok: true };
    }),

  // Bulk operations for sync
  bulkCreate: protectedProcedure
    .input(z.array(TaskCreateSchema))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const taskData of input) {
        const [inserted] = await ctx.db
          .insert(tasks)
          .values({
            projectId: taskData.projectId,
            roleId: taskData.roleId ?? null,
            title: taskData.title,
            description: taskData.description ?? '',
            status: taskData.status,
            dueDate: taskData.dueDate ? taskData.dueDate : null,
            isDaily: taskData.isDaily ?? false,
            priorityScore: taskData.priorityScore,
          })
          .returning();
        results.push(inserted);
      }
      return results;
    }),

  bulkUpdate: protectedProcedure
    .input(z.array(TaskUpdateSchema))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const taskData of input) {
        const { id, ...updateData } = taskData;
        const [updated] = await ctx.db
          .update(tasks)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(tasks.id, id))
          .returning();
        results.push(updated);
      }
      return results;
    }),

  bulkDelete: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const taskId of input) {
        const [deleted] = await ctx.db
          .delete(tasks)
          .where(eq(tasks.id, taskId))
          .returning();
        results.push(deleted);
      }
      return results;
    }),

  // Sync operations
  sync: protectedProcedure
    .input(
      z.object({
        lastSyncAt: z.number().optional(),
        tasks: z.array(
          z.object({
            id: z.string(),
            projectId: z.string(),
            title: z.string(),
            description: z.string().optional(),
            status: StatusEnum,
            priorityScore: PriorityEnum,
            position: z.number(),
            updatedAt: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { lastSyncAt, tasks: clientTasks } = input;

      // Get server tasks updated since last sync
      const serverTasks = await ctx.db
        .select()
        .from(tasks)
        .where(
          lastSyncAt ? gte(tasks.updatedAt, new Date(lastSyncAt)) : undefined
        );

      // Compare and resolve conflicts
      const conflicts = [];
      const updates = [];

      for (const clientTask of clientTasks) {
        const serverTask = serverTasks.find((t) => t.id === clientTask.id);

        if (serverTask) {
          const clientTime = new Date(clientTask.updatedAt).getTime();
          const serverTime = new Date(serverTask.updatedAt).getTime();

          if (clientTime > serverTime) {
            // Client is newer, update server
            updates.push({
              ...clientTask,
              id: clientTask.id,
              updatedAt: new Date(),
            });
          } else if (serverTime > clientTime) {
            // Server is newer, return to client
            conflicts.push({
              type: 'conflict',
              entityType: 'task',
              entityId: clientTask.id,
              serverVersion: serverTask,
              clientVersion: clientTask,
            });
          }
        } else {
          // New task from client
          updates.push({
            ...clientTask,
            updatedAt: new Date(),
          });
        }
      }

      // Apply updates
      for (const update of updates) {
        await ctx.db.update(tasks).set(update).where(eq(tasks.id, update.id));
      }

      return {
        serverTasks,
        conflicts,
        updatedCount: updates.length,
      };
    }),
});
