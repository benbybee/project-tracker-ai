// Add to existing imports
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  sprints,
  sprintWeeks,
  opportunities,
  tasks,
  projects,
} from '@/server/db';
import { eq, and, desc, sql, isNull, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Input schemas
const SprintCreate = z.object({
  name: z.string().min(1),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(), // YYYY-MM-DD
  goalSummary: z.string().optional(),
});

const SprintUpdate = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  goalSummary: z.string().optional(),
  isActive: z.boolean().optional(),
});

const WeekCreate = z.object({
  sprintId: z.string().uuid(),
  weekIndex: z.number().min(1).max(13),
  startDate: z.string(),
  endDate: z.string(),
  theme: z.string().optional(),
  notes: z.string().optional(),
});

const WeekUpdate = z.object({
  id: z.string().uuid(),
  theme: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const OpportunityCreate = z.object({
  name: z.string().min(1),
  type: z.enum(['MAJOR', 'MICRO']),
  sprintId: z.string().uuid().optional(),
  lane: z.string().optional(),
  summary: z.string().optional(),
  complexity: z.string().optional(),
  estimatedCost: z.string().optional(), // Stored as decimal string
  goToMarket: z.string().optional(),
  details: z.string().optional(),
  priority: z.number().min(1).max(4).optional(),
  notes: z.string().optional(),
});

const OpportunityUpdate = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  type: z.enum(['MAJOR', 'MICRO']).optional(),
  sprintId: z.string().uuid().optional().nullable(),
  lane: z.string().optional(),
  summary: z.string().optional(),
  complexity: z.string().optional(),
  estimatedCost: z.string().optional(),
  goToMarket: z.string().optional(),
  details: z.string().optional(),
  status: z
    .enum(['IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'KILLED'])
    .optional(),
  priority: z.number().min(1).max(4).optional(),
  notes: z.string().optional(),
});

const OpportunityComplete = z.object({
  id: z.string().uuid(),
  actualCost: z.string().optional(),
  revenue: z.string().optional(),
  profit: z.string().optional(),
  decision: z.enum(['KEEP', 'ADJUST', 'CANCEL', 'UNDECIDED']),
  outcomeNotes: z.string().optional(),
});

// Task Input Schemas
const TaskCreate = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().min(1).max(4).optional(),
  budgetPlanned: z.string().optional(),
  sprintId: z.string().uuid(),
  sprintWeekId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
});

const TaskUpdate = z.object({
  id: z.string().uuid(),
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
  title: z.string().min(1).optional(),
  priority: z.number().min(1).max(4).optional(),
  budgetPlanned: z.string().optional(),
  budgetSpent: z.string().optional(),
  sprintWeekId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
});

const TaskBulkUpdate = z.object({
  ids: z.array(z.string().uuid()),
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
  sprintWeekId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
});

export const pattern4Router = createTRPCRouter({
  // ===== TASK PROCEDURES =====
  tasks: createTRPCRouter({
    listBySprintCurrent: protectedProcedure
      .input(
        z.object({ sprintId: z.string().uuid(), weekId: z.string().uuid() })
      )
      .query(async ({ input, ctx }) => {
        const results = await ctx.db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            budgetPlanned: tasks.budgetPlanned,
            budgetSpent: tasks.budgetSpent,
            sprintWeek: {
              weekIndex: sprintWeeks.weekIndex,
            },
            opportunity: {
              name: opportunities.name,
            },
          })
          .from(tasks)
          .leftJoin(sprintWeeks, eq(tasks.sprintWeekId, sprintWeeks.id))
          .leftJoin(opportunities, eq(tasks.opportunityId, opportunities.id))
          .where(
            and(
              eq(tasks.sprintId, input.sprintId),
              eq(tasks.sprintWeekId, input.weekId),
              eq(tasks.userId, ctx.session.user.id)
            )
          )
          .orderBy(desc(tasks.priority), desc(tasks.createdAt));

        return results;
      }),

    listByWeek: protectedProcedure
      .input(z.object({ weekId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const results = await ctx.db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            budgetPlanned: tasks.budgetPlanned,
            budgetSpent: tasks.budgetSpent,
            sprintWeek: {
              weekIndex: sprintWeeks.weekIndex,
            },
            opportunity: {
              name: opportunities.name,
            },
          })
          .from(tasks)
          .leftJoin(sprintWeeks, eq(tasks.sprintWeekId, sprintWeeks.id))
          .leftJoin(opportunities, eq(tasks.opportunityId, opportunities.id))
          .where(
            and(
              eq(tasks.sprintWeekId, input.weekId),
              eq(tasks.userId, ctx.session.user.id)
            )
          )
          .orderBy(desc(tasks.priority), desc(tasks.createdAt));

        return results;
      }),

    listByOpportunity: protectedProcedure
      .input(z.object({ opportunityId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const results = await ctx.db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            budgetPlanned: tasks.budgetPlanned,
            budgetSpent: tasks.budgetSpent,
            sprintWeek: {
              weekIndex: sprintWeeks.weekIndex,
            },
            opportunity: {
              name: opportunities.name,
            },
          })
          .from(tasks)
          .leftJoin(sprintWeeks, eq(tasks.sprintWeekId, sprintWeeks.id))
          .leftJoin(opportunities, eq(tasks.opportunityId, opportunities.id))
          .where(
            and(
              eq(tasks.opportunityId, input.opportunityId),
              eq(tasks.userId, ctx.session.user.id)
            )
          )
          .orderBy(sprintWeeks.weekIndex, desc(tasks.priority));

        return results;
      }),

    create: protectedProcedure
      .input(TaskCreate)
      .mutation(async ({ input, ctx }) => {
        // Find default project (create if not exists)
        let defaultProject = await ctx.db.query.projects.findFirst({
          where: eq(projects.userId, ctx.session.user.id),
        });

        if (!defaultProject) {
          // If no projects exist, create a default "General" project
          const [newProject] = await ctx.db
            .insert(projects)
            .values({
              userId: ctx.session.user.id,
              name: 'General',
              type: 'general',
            })
            .returning();
          defaultProject = newProject;
        }

        const [newTask] = await ctx.db
          .insert(tasks)
          .values({
            userId: ctx.session.user.id,
            projectId: defaultProject!.id,
            title: input.title,
            description: input.description,
            priorityScore: (input.priority?.toString() || '3') as '1' | '2' | '3' | '4',
            budgetPlanned: input.budgetPlanned,
            sprintId: input.sprintId,
            sprintWeekId: input.sprintWeekId,
            opportunityId: input.opportunityId,
            status: 'not_started',
          })
          .returning();

        return newTask;
      }),

    update: protectedProcedure
      .input(TaskUpdate)
      .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;

        // Convert priority to string if present (schema expects string enum '1'-'4')
        const updatePayload: any = { ...updateData };
        if (updateData.priority) {
          updatePayload.priority = updateData.priority.toString();
        }

        const [updatedTask] = await ctx.db
          .update(tasks)
          .set({
            ...updatePayload,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.id, id), eq(tasks.userId, ctx.session.user.id)))
          .returning();

        if (!updatedTask) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        return updatedTask;
      }),

    bulkUpdate: protectedProcedure
      .input(TaskBulkUpdate)
      .mutation(async ({ input, ctx }) => {
        const { ids, ...updateData } = input;

        if (ids.length === 0) return [];

        const updatedTasks = await ctx.db
          .update(tasks)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(
            and(inArray(tasks.id, ids), eq(tasks.userId, ctx.session.user.id))
          )
          .returning();

        return updatedTasks;
      }),

    delete: protectedProcedure
      .input(z.array(z.string().uuid()))
      .mutation(async ({ input, ctx }) => {
        if (input.length === 0) return [];

        const deletedTasks = await ctx.db
          .delete(tasks)
          .where(
            and(inArray(tasks.id, input), eq(tasks.userId, ctx.session.user.id))
          )
          .returning();

        return deletedTasks;
      }),
  }),

  // ===== SPRINT PROCEDURES =====
  sprints: createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const userSprints = await ctx.db
          .select()
          .from(sprints)
          .where(eq(sprints.userId, ctx.session.user.id))
          .orderBy(desc(sprints.createdAt));

        return userSprints;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sprints',
          cause: error,
        });
      }
    }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
      try {
        const [activeSprint] = await ctx.db
          .select()
          .from(sprints)
          .where(
            and(
              eq(sprints.userId, ctx.session.user.id),
              eq(sprints.isActive, true)
            )
          )
          .orderBy(desc(sprints.createdAt))
          .limit(1);

        return activeSprint || null;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch active sprint',
          cause: error,
        });
      }
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const [sprint] = await ctx.db
          .select()
          .from(sprints)
          .where(
            and(
              eq(sprints.id, input.id),
              eq(sprints.userId, ctx.session.user.id)
            )
          );

        if (!sprint) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint not found',
          });
        }

        return sprint;
      }),

    create: protectedProcedure
      .input(SprintCreate)
      .mutation(async ({ input, ctx }) => {
        // Deactivate any existing active sprints
        await ctx.db
          .update(sprints)
          .set({ isActive: false })
          .where(
            and(
              eq(sprints.userId, ctx.session.user.id),
              eq(sprints.isActive, true)
            )
          );

        const [newSprint] = await ctx.db
          .insert(sprints)
          .values({
            userId: ctx.session.user.id,
            name: input.name,
            startDate: input.startDate,
            endDate: input.endDate,
            goalSummary: input.goalSummary,
            isActive: true,
          })
          .returning();

        return newSprint;
      }),

    update: protectedProcedure
      .input(SprintUpdate)
      .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;

        const [updatedSprint] = await ctx.db
          .update(sprints)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(
            and(eq(sprints.id, id), eq(sprints.userId, ctx.session.user.id))
          )
          .returning();

        if (!updatedSprint) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint not found',
          });
        }

        return updatedSprint;
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const [completedSprint] = await ctx.db
          .update(sprints)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(sprints.id, input.id),
              eq(sprints.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!completedSprint) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint not found',
          });
        }

        return completedSprint;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const [deletedSprint] = await ctx.db
          .delete(sprints)
          .where(
            and(
              eq(sprints.id, input.id),
              eq(sprints.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!deletedSprint) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint not found',
          });
        }

        return deletedSprint;
      }),
  }),

  // ===== SPRINT WEEK PROCEDURES =====
  weeks: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({ sprintId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        try {
          // Verify sprint belongs to user
          const [sprint] = await ctx.db
            .select()
            .from(sprints)
            .where(
              and(
                eq(sprints.id, input.sprintId),
                eq(sprints.userId, ctx.session.user.id)
              )
            );

          if (!sprint) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Sprint not found',
            });
          }

          const weeks = await ctx.db
            .select()
            .from(sprintWeeks)
            .where(eq(sprintWeeks.sprintId, input.sprintId))
            .orderBy(sprintWeeks.weekIndex);

          return weeks;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch sprint weeks',
            cause: error,
          });
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const [week] = await ctx.db
          .select({
            week: sprintWeeks,
            sprint: sprints,
          })
          .from(sprintWeeks)
          .innerJoin(sprints, eq(sprintWeeks.sprintId, sprints.id))
          .where(
            and(
              eq(sprintWeeks.id, input.id),
              eq(sprints.userId, ctx.session.user.id)
            )
          );

        if (!week) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint week not found',
          });
        }

        return week;
      }),

    create: protectedProcedure
      .input(WeekCreate)
      .mutation(async ({ input, ctx }) => {
        // Verify sprint belongs to user
        const [sprint] = await ctx.db
          .select()
          .from(sprints)
          .where(
            and(
              eq(sprints.id, input.sprintId),
              eq(sprints.userId, ctx.session.user.id)
            )
          );

        if (!sprint) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint not found',
          });
        }

        const [newWeek] = await ctx.db
          .insert(sprintWeeks)
          .values({
            sprintId: input.sprintId,
            weekIndex: input.weekIndex,
            startDate: input.startDate,
            endDate: input.endDate,
            theme: input.theme,
            notes: input.notes,
          })
          .returning();

        return newWeek;
      }),

    update: protectedProcedure
      .input(WeekUpdate)
      .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;

        // Verify week belongs to user's sprint
        const [week] = await ctx.db
          .select({
            week: sprintWeeks,
            sprint: sprints,
          })
          .from(sprintWeeks)
          .innerJoin(sprints, eq(sprintWeeks.sprintId, sprints.id))
          .where(
            and(eq(sprintWeeks.id, id), eq(sprints.userId, ctx.session.user.id))
          );

        if (!week) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint week not found',
          });
        }

        const [updatedWeek] = await ctx.db
          .update(sprintWeeks)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(sprintWeeks.id, id))
          .returning();

        return updatedWeek;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        // Verify week belongs to user's sprint
        const [week] = await ctx.db
          .select({
            week: sprintWeeks,
            sprint: sprints,
          })
          .from(sprintWeeks)
          .innerJoin(sprints, eq(sprintWeeks.sprintId, sprints.id))
          .where(
            and(
              eq(sprintWeeks.id, input.id),
              eq(sprints.userId, ctx.session.user.id)
            )
          );

        if (!week) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint week not found',
          });
        }

        const [deletedWeek] = await ctx.db
          .delete(sprintWeeks)
          .where(eq(sprintWeeks.id, input.id))
          .returning();

        return deletedWeek;
      }),
  }),

  // ===== OPPORTUNITY PROCEDURES =====
  opportunities: createTRPCRouter({
    list: protectedProcedure
      .input(
        z
          .object({
            status: z
              .enum([
                'IDEA',
                'PLANNING',
                'ACTIVE',
                'ON_HOLD',
                'COMPLETED',
                'KILLED',
              ])
              .optional(),
            sprintId: z.string().uuid().optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        try {
          const conditions = [eq(opportunities.userId, ctx.session.user.id)];
          
          if (input?.status) {
            conditions.push(eq(opportunities.status, input.status));
          }
          
          if (input?.sprintId) {
            conditions.push(eq(opportunities.sprintId, input.sprintId));
          }

          const result = await ctx.db
            .select()
            .from(opportunities)
            .where(and(...conditions))
            .orderBy(desc(opportunities.createdAt));

          return result;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch opportunities',
            cause: error,
          });
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const [opportunity] = await ctx.db
          .select()
          .from(opportunities)
          .where(
            and(
              eq(opportunities.id, input.id),
              eq(opportunities.userId, ctx.session.user.id)
            )
          );

        if (!opportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        return opportunity;
      }),

    create: protectedProcedure
      .input(OpportunityCreate)
      .mutation(async ({ input, ctx }) => {
        // If sprintId provided, verify it belongs to user
        if (input.sprintId) {
          const [sprint] = await ctx.db
            .select()
            .from(sprints)
            .where(
              and(
                eq(sprints.id, input.sprintId),
                eq(sprints.userId, ctx.session.user.id)
              )
            );

          if (!sprint) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Sprint not found',
            });
          }
        }

        const [newOpportunity] = await ctx.db
          .insert(opportunities)
          .values({
            userId: ctx.session.user.id,
            name: input.name,
            type: input.type,
            sprintId: input.sprintId,
            lane: input.lane,
            summary: input.summary,
            complexity: input.complexity,
            estimatedCost: input.estimatedCost,
            goToMarket: input.goToMarket,
            details: input.details,
            priority: input.priority ?? 3,
            notes: input.notes,
          })
          .returning();

        return newOpportunity;
      }),

    update: protectedProcedure
      .input(OpportunityUpdate)
      .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;

        const [updatedOpportunity] = await ctx.db
          .update(opportunities)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(opportunities.id, id),
              eq(opportunities.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!updatedOpportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        return updatedOpportunity;
      }),

    complete: protectedProcedure
      .input(OpportunityComplete)
      .mutation(async ({ input, ctx }) => {
        const { id, ...performanceData } = input;

        // Calculate total budget spent from linked tasks
        const linkedTasks = await ctx.db
          .select({
            budgetSpent: tasks.budgetSpent,
          })
          .from(tasks)
          .where(
            and(
              eq(tasks.opportunityId, id),
              eq(tasks.userId, ctx.session.user.id)
            )
          );

        const totalBudgetSpent = linkedTasks.reduce((sum, task) => {
          return sum + (parseFloat(task.budgetSpent || '0') || 0);
        }, 0);

        const [completedOpportunity] = await ctx.db
          .update(opportunities)
          .set({
            status: 'COMPLETED',
            actualCost:
              performanceData.actualCost || totalBudgetSpent.toString(),
            revenue: performanceData.revenue,
            profit: performanceData.profit,
            decision: performanceData.decision,
            outcomeNotes: performanceData.outcomeNotes,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(opportunities.id, id),
              eq(opportunities.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!completedOpportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        return completedOpportunity;
      }),

    kill: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          outcomeNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const [killedOpportunity] = await ctx.db
          .update(opportunities)
          .set({
            status: 'KILLED',
            outcomeNotes: input.outcomeNotes,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(opportunities.id, input.id),
              eq(opportunities.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!killedOpportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        return killedOpportunity;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const [deletedOpportunity] = await ctx.db
          .delete(opportunities)
          .where(
            and(
              eq(opportunities.id, input.id),
              eq(opportunities.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!deletedOpportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        return deletedOpportunity;
      }),
  }),

  // ===== STATS PROCEDURES =====
  stats: createTRPCRouter({
    sprintProgress: protectedProcedure
      .input(z.object({ sprintId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        // Verify sprint belongs to user
        const [sprint] = await ctx.db
          .select()
          .from(sprints)
          .where(
            and(
              eq(sprints.id, input.sprintId),
              eq(sprints.userId, ctx.session.user.id)
            )
          );

        if (!sprint) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint not found',
          });
        }

        // Get all tasks for this sprint
        const sprintTasks = await ctx.db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.sprintId, input.sprintId),
              eq(tasks.userId, ctx.session.user.id)
            )
          );

        const totalTasks = sprintTasks.length;
        const completedTasks = sprintTasks.filter(
          (t) => t.status === 'completed'
        ).length;
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          totalTasks,
          completedTasks,
          completionPercentage,
        };
      }),

    weekProgress: protectedProcedure
      .input(z.object({ weekId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        // Verify week belongs to user's sprint
        const [week] = await ctx.db
          .select({
            week: sprintWeeks,
            sprint: sprints,
          })
          .from(sprintWeeks)
          .innerJoin(sprints, eq(sprintWeeks.sprintId, sprints.id))
          .where(
            and(
              eq(sprintWeeks.id, input.weekId),
              eq(sprints.userId, ctx.session.user.id)
            )
          );

        if (!week) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sprint week not found',
          });
        }

        // Get all tasks for this week
        const weekTasks = await ctx.db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.sprintWeekId, input.weekId),
              eq(tasks.userId, ctx.session.user.id)
            )
          );

        const totalTasks = weekTasks.length;
        const completedTasks = weekTasks.filter(
          (t) => t.status === 'completed'
        ).length;
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          totalTasks,
          completedTasks,
          completionPercentage,
        };
      }),

    opportunityProgress: protectedProcedure
      .input(z.object({ opportunityId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        // Verify opportunity belongs to user
        const [opportunity] = await ctx.db
          .select()
          .from(opportunities)
          .where(
            and(
              eq(opportunities.id, input.opportunityId),
              eq(opportunities.userId, ctx.session.user.id)
            )
          );

        if (!opportunity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Opportunity not found',
          });
        }

        // Get all tasks for this opportunity
        const opportunityTasks = await ctx.db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.opportunityId, input.opportunityId),
              eq(tasks.userId, ctx.session.user.id)
            )
          );

        const totalTasks = opportunityTasks.length;
        const completedTasks = opportunityTasks.filter(
          (t) => t.status === 'completed'
        ).length;
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate total budget spent
        const totalBudgetPlanned = opportunityTasks.reduce((sum, task) => {
          return sum + (parseFloat(task.budgetPlanned || '0') || 0);
        }, 0);

        const totalBudgetSpent = opportunityTasks.reduce((sum, task) => {
          return sum + (parseFloat(task.budgetSpent || '0') || 0);
        }, 0);

        return {
          totalTasks,
          completedTasks,
          completionPercentage,
          totalBudgetPlanned: totalBudgetPlanned.toFixed(2),
          totalBudgetSpent: totalBudgetSpent.toFixed(2),
        };
      }),
  }),
});
