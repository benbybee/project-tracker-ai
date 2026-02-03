import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  ideaforgeIdeas,
  ideaforgePlans,
  ideaforgePlanTasks,
  ideaforgeTranscripts,
  ideaforgeUserMemory,
  ideaforgeTaskNotes,
  ideaforgeSyncMap,
} from '@/server/db/schema/ideaforge';
import { projects, tasks } from '@/server/db';
import { and, desc, eq, sql } from 'drizzle-orm';

const IdeaCreateSchema = z.object({
  title: z.string().min(1),
  oneLiner: z.string().optional(),
  notes: z.string().optional(),
});

const IdeaUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  oneLiner: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum([
      'INBOX',
      'EXPLORING',
      'VALIDATING',
      'PLANNED',
      'EXECUTING',
      'ARCHIVED',
    ])
    .optional(),
});

const TranscriptAddSchema = z.object({
  ideaId: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  mode: z.enum(['text', 'voice']).optional(),
  aiMode: z.enum(['freeform', 'guided', 'critical']),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const PlanTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().min(1).max(4).optional(),
  budgetPlanned: z.string().optional(),
  dueDate: z.string().optional(),
  dependencies: z.string().optional(),
  sprintId: z.string().uuid().optional(),
  sprintWeekId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
});

const PlanCommitSchema = z.object({
  ideaId: z.string().uuid(),
  scheduleMode: z.enum(['realistic', 'aggressive', 'deadline']),
  projectId: z.string().uuid(),
  tasks: z.array(PlanTaskInputSchema).min(1).max(20),
});

const PlanTaskUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.number().min(1).max(4).optional(),
  budgetPlanned: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  dependencies: z.string().optional().nullable(),
  sprintId: z.string().uuid().optional().nullable(),
  sprintWeekId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
});

const TaskNoteCreateSchema = z.object({
  planTaskId: z.string().uuid(),
  content: z.string().min(1),
});

export const ideaforgeRouter = createTRPCRouter({
  ideas: createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: ideaforgeIdeas.id,
          title: ideaforgeIdeas.title,
          oneLiner: ideaforgeIdeas.oneLiner,
          notes: ideaforgeIdeas.notes,
          status: ideaforgeIdeas.status,
          lastExploredAt: ideaforgeIdeas.lastExploredAt,
          lastCommittedAt: ideaforgeIdeas.lastCommittedAt,
          createdAt: ideaforgeIdeas.createdAt,
          updatedAt: ideaforgeIdeas.updatedAt,
        })
        .from(ideaforgeIdeas)
        .where(eq(ideaforgeIdeas.userId, ctx.session.user.id))
        .orderBy(desc(ideaforgeIdeas.updatedAt));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const [idea] = await ctx.db
          .select({
            id: ideaforgeIdeas.id,
            title: ideaforgeIdeas.title,
            oneLiner: ideaforgeIdeas.oneLiner,
            notes: ideaforgeIdeas.notes,
            status: ideaforgeIdeas.status,
            lastExploredAt: ideaforgeIdeas.lastExploredAt,
            lastCommittedAt: ideaforgeIdeas.lastCommittedAt,
            createdAt: ideaforgeIdeas.createdAt,
            updatedAt: ideaforgeIdeas.updatedAt,
          })
          .from(ideaforgeIdeas)
          .where(
            and(
              eq(ideaforgeIdeas.id, input.id),
              eq(ideaforgeIdeas.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (!idea) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Idea not found' });
        }

        return idea;
      }),

    create: protectedProcedure
      .input(IdeaCreateSchema)
      .mutation(async ({ input, ctx }) => {
        const [idea] = await ctx.db
          .insert(ideaforgeIdeas)
          .values({
            userId: ctx.session.user.id,
            title: input.title,
            oneLiner: input.oneLiner ?? null,
            notes: input.notes ?? null,
            status: 'INBOX',
          })
          .returning();

        return idea;
      }),

    update: protectedProcedure
      .input(IdeaUpdateSchema)
      .mutation(async ({ input, ctx }) => {
        const [updated] = await ctx.db
          .update(ideaforgeIdeas)
          .set({
            title: input.title,
            oneLiner: input.oneLiner,
            notes: input.notes,
            status: input.status,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(ideaforgeIdeas.id, input.id),
              eq(ideaforgeIdeas.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!updated) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Idea not found' });
        }

        return updated;
      }),
  }),

  transcripts: createTRPCRouter({
    list: protectedProcedure
      .input(z.object({ ideaId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        return ctx.db
          .select({
            id: ideaforgeTranscripts.id,
            ideaId: ideaforgeTranscripts.ideaId,
            role: ideaforgeTranscripts.role,
            mode: ideaforgeTranscripts.mode,
            aiMode: ideaforgeTranscripts.aiMode,
            content: ideaforgeTranscripts.content,
            metadata: ideaforgeTranscripts.metadata,
            createdAt: ideaforgeTranscripts.createdAt,
          })
          .from(ideaforgeTranscripts)
          .where(
            and(
              eq(ideaforgeTranscripts.ideaId, input.ideaId),
              eq(ideaforgeTranscripts.userId, ctx.session.user.id)
            )
          )
          .orderBy(desc(ideaforgeTranscripts.createdAt));
      }),

    add: protectedProcedure
      .input(TranscriptAddSchema)
      .mutation(async ({ input, ctx }) => {
        const [idea] = await ctx.db
          .select({ id: ideaforgeIdeas.id })
          .from(ideaforgeIdeas)
          .where(
            and(
              eq(ideaforgeIdeas.id, input.ideaId),
              eq(ideaforgeIdeas.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (!idea) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Idea not found' });
        }

        const [row] = await ctx.db
          .insert(ideaforgeTranscripts)
          .values({
            userId: ctx.session.user.id,
            ideaId: input.ideaId,
            role: input.role,
            mode: input.mode ?? 'text',
            aiMode: input.aiMode,
            content: input.content,
            metadata: input.metadata ?? null,
          })
          .returning();

        await ctx.db
          .update(ideaforgeIdeas)
          .set({
            lastExploredAt: new Date(),
            status: sql`CASE WHEN ${ideaforgeIdeas.status} = 'INBOX' THEN 'EXPLORING' ELSE ${ideaforgeIdeas.status} END`,
            updatedAt: new Date(),
          })
          .where(eq(ideaforgeIdeas.id, input.ideaId));

        return row;
      }),
  }),

  memory: createTRPCRouter({
    get: protectedProcedure.query(async ({ ctx }) => {
      const [memory] = await ctx.db
        .select({
          id: ideaforgeUserMemory.id,
          profile: ideaforgeUserMemory.profile,
          updatedAt: ideaforgeUserMemory.updatedAt,
        })
        .from(ideaforgeUserMemory)
        .where(eq(ideaforgeUserMemory.userId, ctx.session.user.id))
        .limit(1);

      if (!memory) {
        return { profile: {}, updatedAt: null };
      }

      return memory;
    }),

    upsert: protectedProcedure
      .input(z.object({ profile: z.record(z.any()) }))
      .mutation(async ({ input, ctx }) => {
        const [existing] = await ctx.db
          .select({ id: ideaforgeUserMemory.id })
          .from(ideaforgeUserMemory)
          .where(eq(ideaforgeUserMemory.userId, ctx.session.user.id))
          .limit(1);

        if (existing) {
          const [updated] = await ctx.db
            .update(ideaforgeUserMemory)
            .set({ profile: input.profile, updatedAt: new Date() })
            .where(eq(ideaforgeUserMemory.id, existing.id))
            .returning();
          return updated;
        }

        const [created] = await ctx.db
          .insert(ideaforgeUserMemory)
          .values({
            userId: ctx.session.user.id,
            profile: input.profile,
          })
          .returning();
        return created;
      }),
  }),

  plans: createTRPCRouter({
    listByIdea: protectedProcedure
      .input(z.object({ ideaId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        return ctx.db
          .select({
            id: ideaforgePlans.id,
            ideaId: ideaforgePlans.ideaId,
            version: ideaforgePlans.version,
            scheduleMode: ideaforgePlans.scheduleMode,
            createdAt: ideaforgePlans.createdAt,
          })
          .from(ideaforgePlans)
          .where(
            and(
              eq(ideaforgePlans.ideaId, input.ideaId),
              eq(ideaforgePlans.userId, ctx.session.user.id)
            )
          )
          .orderBy(desc(ideaforgePlans.version));
      }),

    commit: protectedProcedure
      .input(PlanCommitSchema)
      .mutation(async ({ input, ctx }) => {
        const [idea] = await ctx.db
          .select({
            id: ideaforgeIdeas.id,
            status: ideaforgeIdeas.status,
          })
          .from(ideaforgeIdeas)
          .where(
            and(
              eq(ideaforgeIdeas.id, input.ideaId),
              eq(ideaforgeIdeas.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (!idea) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Idea not found' });
        }

        const [project] = await ctx.db
          .select({ id: projects.id })
          .from(projects)
          .where(
            and(
              eq(projects.id, input.projectId),
              eq(projects.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        return ctx.db.transaction(async (tx) => {
          const [current] = await tx
            .select({
              maxVersion: sql<number | null>`max(${ideaforgePlans.version})`,
            })
            .from(ideaforgePlans)
            .where(
              and(
                eq(ideaforgePlans.ideaId, input.ideaId),
                eq(ideaforgePlans.userId, ctx.session.user.id)
              )
            );

          const nextVersion = (current?.maxVersion ?? 0) + 1;

          const [plan] = await tx
            .insert(ideaforgePlans)
            .values({
              userId: ctx.session.user.id,
              ideaId: input.ideaId,
              version: nextVersion,
              scheduleMode: input.scheduleMode,
              snapshot: { tasks: input.tasks },
            })
            .returning();

          const createdPlanTasks = [];

          for (const taskInput of input.tasks) {
            const [createdTask] = await tx
              .insert(tasks)
              .values({
                userId: ctx.session.user.id,
                projectId: input.projectId,
                title: taskInput.title,
                description: taskInput.description ?? '',
                priority: taskInput.priority ?? null,
                priorityScore: (taskInput.priority
                  ? String(taskInput.priority)
                  : '2') as '1' | '2' | '3' | '4',
                dueDate: taskInput.dueDate ?? null,
                sprintId: taskInput.sprintId ?? null,
                sprintWeekId: taskInput.sprintWeekId ?? null,
                opportunityId: taskInput.opportunityId ?? null,
              })
              .returning();

            const [planTask] = await tx
              .insert(ideaforgePlanTasks)
              .values({
                userId: ctx.session.user.id,
                planId: plan.id,
                ideaId: input.ideaId,
                title: taskInput.title,
                description: taskInput.description ?? null,
                priority: taskInput.priority ?? null,
                budgetPlanned: taskInput.budgetPlanned ?? null,
                dueDate: taskInput.dueDate ?? null,
                dependencies: taskInput.dependencies ?? null,
                projectId: input.projectId,
                sprintId: taskInput.sprintId ?? null,
                sprintWeekId: taskInput.sprintWeekId ?? null,
                opportunityId: taskInput.opportunityId ?? null,
                taskId: createdTask.id,
              })
              .returning();

            await tx.insert(ideaforgeSyncMap).values({
              userId: ctx.session.user.id,
              ideaId: input.ideaId,
              planVersion: `v${nextVersion}`,
              planTaskId: planTask.id,
              taskId: createdTask.id,
              projectId: input.projectId,
              sprintId: taskInput.sprintId ?? null,
              sprintWeekId: taskInput.sprintWeekId ?? null,
              opportunityId: taskInput.opportunityId ?? null,
              lastChangeSource: 'idea_app',
            });

            createdPlanTasks.push(planTask);
          }

          await tx
            .update(ideaforgeIdeas)
            .set({
              status: 'EXECUTING',
              lastCommittedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(ideaforgeIdeas.id, input.ideaId));

          return { plan, tasks: createdPlanTasks };
        });
      }),
  }),

  planTasks: createTRPCRouter({
    listByPlan: protectedProcedure
      .input(z.object({ planId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        return ctx.db
          .select({
            id: ideaforgePlanTasks.id,
            ideaId: ideaforgePlanTasks.ideaId,
            planId: ideaforgePlanTasks.planId,
            title: ideaforgePlanTasks.title,
            description: ideaforgePlanTasks.description,
            priority: ideaforgePlanTasks.priority,
            budgetPlanned: ideaforgePlanTasks.budgetPlanned,
            dueDate: ideaforgePlanTasks.dueDate,
            dependencies: ideaforgePlanTasks.dependencies,
            projectId: ideaforgePlanTasks.projectId,
            sprintId: ideaforgePlanTasks.sprintId,
            sprintWeekId: ideaforgePlanTasks.sprintWeekId,
            opportunityId: ideaforgePlanTasks.opportunityId,
            taskId: ideaforgePlanTasks.taskId,
            createdAt: ideaforgePlanTasks.createdAt,
            updatedAt: ideaforgePlanTasks.updatedAt,
          })
          .from(ideaforgePlanTasks)
          .where(
            and(
              eq(ideaforgePlanTasks.planId, input.planId),
              eq(ideaforgePlanTasks.userId, ctx.session.user.id)
            )
          )
          .orderBy(desc(ideaforgePlanTasks.createdAt));
      }),

    update: protectedProcedure
      .input(PlanTaskUpdateSchema)
      .mutation(async ({ input, ctx }) => {
        const dueDateValue = input.dueDate === null ? null : input.dueDate;
        const dependenciesValue =
          input.dependencies === null ? null : input.dependencies;
        const sprintIdValue = input.sprintId === null ? null : input.sprintId;
        const sprintWeekIdValue =
          input.sprintWeekId === null ? null : input.sprintWeekId;
        const opportunityIdValue =
          input.opportunityId === null ? null : input.opportunityId;

        const [updated] = await ctx.db
          .update(ideaforgePlanTasks)
          .set({
            title: input.title,
            description: input.description,
            priority: input.priority,
            budgetPlanned: input.budgetPlanned,
            dueDate: dueDateValue,
            dependencies: dependenciesValue,
            sprintId: sprintIdValue,
            sprintWeekId: sprintWeekIdValue,
            opportunityId: opportunityIdValue,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(ideaforgePlanTasks.id, input.id),
              eq(ideaforgePlanTasks.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Plan task not found',
          });
        }

        return updated;
      }),

    addNote: protectedProcedure
      .input(TaskNoteCreateSchema)
      .mutation(async ({ input, ctx }) => {
        const [note] = await ctx.db
          .insert(ideaforgeTaskNotes)
          .values({
            userId: ctx.session.user.id,
            planTaskId: input.planTaskId,
            content: input.content,
            source: 'ideaforge',
          })
          .returning();

        return note;
      }),
  }),
});
