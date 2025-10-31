import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { projects, roles, tasks } from '@/server/db';
import { eq, and, like, or, desc, gte, lte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { upsertEmbedding } from '@/server/search/upsertEmbedding';
import { logProjectActivity } from '@/lib/activity-logger';

const ProjectCreate = z.object({
  name: z.string().min(2),
  type: z.enum(['general', 'website']),
  description: z.string().optional(),
  roleId: z.string().optional(),
  domain: z.string().optional(),
  hostingProvider: z.string().optional(),
  dnsStatus: z.string().optional(),
  goLiveDate: z.string().optional(), // ISO
  repoUrl: z.string().optional(),
  stagingUrl: z.string().optional(),
  // WordPress one-click login fields
  wpOneClickEnabled: z.boolean().optional(),
  wpAdminEmail: z.string().email().optional(),
  wpApiKey: z.string().optional(),
});

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: z.enum(['general', 'website']).optional(),
        roleId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const conditions = [eq(projects.userId, ctx.session.user.id)];

        if (input.search) {
          conditions.push(
            or(
              like(projects.name, `%${input.search}%`),
              like(projects.description, `%${input.search}%`)
            )!
          );
        }

        if (input.type) {
          conditions.push(eq(projects.type, input.type));
        }

        if (input.roleId) {
          conditions.push(eq(projects.roleId, input.roleId));
        }

        return await ctx.db
          .select({
            id: projects.id,
            name: projects.name,
            type: projects.type,
            description: projects.description,
            roleId: projects.roleId,
            notes: projects.notes,
            pinned: projects.pinned,
            domain: projects.domain,
            hostingProvider: projects.hostingProvider,
            dnsStatus: projects.dnsStatus,
            goLiveDate: projects.goLiveDate,
            repoUrl: projects.repoUrl,
            stagingUrl: projects.stagingUrl,
            checklistJson: projects.checklistJson,
            websiteStatus: projects.websiteStatus,
            wpOneClickEnabled: projects.wpOneClickEnabled,
            wpAdminEmail: projects.wpAdminEmail,
            wpApiKey: projects.wpApiKey,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            role: {
              id: roles.id,
              name: roles.name,
              color: roles.color,
            },
          })
          .from(projects)
          .leftJoin(roles, eq(projects.roleId, roles.id))
          .where(and(...conditions))
          .orderBy(desc(projects.pinned), desc(projects.updatedAt));
      } catch (error: any) {
        // Enhanced error logging for debugging
        console.error('[projects.list] Database query failed:', {
          error: error?.message,
          code: error?.code,
          userId: ctx.session.user.id,
          input,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Failed to fetch projects. Please check database connection.',
          cause: error,
        });
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db
        .select({
          id: projects.id,
          name: projects.name,
          type: projects.type,
          description: projects.description,
          notes: projects.notes,
          pinned: projects.pinned,
          domain: projects.domain,
          hostingProvider: projects.hostingProvider,
          dnsStatus: projects.dnsStatus,
          goLiveDate: projects.goLiveDate,
          repoUrl: projects.repoUrl,
          stagingUrl: projects.stagingUrl,
          checklistJson: projects.checklistJson,
          websiteStatus: projects.websiteStatus,
          wpOneClickEnabled: projects.wpOneClickEnabled,
          wpAdminEmail: projects.wpAdminEmail,
          wpApiKey: projects.wpApiKey,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          role: {
            id: roles.id,
            name: roles.name,
            color: roles.color,
          },
        })
        .from(projects)
        .leftJoin(roles, eq(projects.roleId, roles.id))
        .where(
          and(
            eq(projects.id, input.id),
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

      return project;
    }),

  create: protectedProcedure
    .input(ProjectCreate)
    .mutation(async ({ input, ctx }) => {
      const [row] = await ctx.db
        .insert(projects)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          type: input.type,
          description: input.description ?? '',
          roleId: input.roleId ?? null,
          domain: input.domain ?? null,
          hostingProvider: input.hostingProvider ?? null,
          dnsStatus: input.dnsStatus ?? null,
          goLiveDate: input.goLiveDate ? input.goLiveDate : null,
          repoUrl: input.repoUrl ?? null,
          stagingUrl: input.stagingUrl ?? null,
          // Set initial websiteStatus for website projects
          websiteStatus: input.type === 'website' ? 'discovery' : null,
          // WordPress one-click login fields
          wpOneClickEnabled: input.wpOneClickEnabled ?? false,
          wpAdminEmail: input.wpAdminEmail ?? null,
          wpApiKey: input.wpApiKey ?? null,
        })
        .returning();

      // Create embedding for search
      await upsertEmbedding({
        entityType: 'project',
        entityId: row.id,
        text: [
          row.name,
          row.description ?? '',
          row.domain ?? '',
          row.repoUrl ?? '',
        ].join('\n'),
      });

      // Log project creation activity
      await logProjectActivity({
        userId: ctx.session.user.id,
        projectId: row.id,
        projectName: row.name,
        action: 'created',
        payload: {
          type: row.type,
          websiteStatus: row.websiteStatus,
        },
      });

      return row;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        type: z.enum(['general', 'website']).optional(),
        description: z.string().optional(),
        roleId: z.string().optional(),
        notes: z.string().optional(),
        pinned: z.boolean().optional(),
        domain: z.string().optional(),
        hostingProvider: z.string().optional(),
        dnsStatus: z.string().optional(),
        goLiveDate: z.string().optional(),
        repoUrl: z.string().optional(),
        stagingUrl: z.string().optional(),
        checklistJson: z.record(z.any()).optional(),
        websiteStatus: z
          .enum([
            'discovery',
            'development',
            'client_review',
            'completed',
            'blocked',
          ])
          .optional(),
        // WordPress one-click login fields
        wpOneClickEnabled: z.boolean().optional(),
        wpAdminEmail: z.string().email().optional(),
        wpApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const [updatedProject] = await ctx.db
        .update(projects)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(
          and(eq(projects.id, id), eq(projects.userId, ctx.session.user.id))
        )
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Log project update activity
      const changedFields = Object.keys(updateData);
      await logProjectActivity({
        userId: ctx.session.user.id,
        projectId: updatedProject.id,
        projectName: updatedProject.name,
        action: 'updated',
        payload: {
          changedFields,
          ...updateData,
        },
      });

      return updatedProject;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedProject] = await ctx.db
        .delete(projects)
        .where(
          and(
            eq(projects.id, input.id),
            eq(projects.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!deletedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Log project deletion activity
      await logProjectActivity({
        userId: ctx.session.user.id,
        projectId: deletedProject.id,
        projectName: deletedProject.name,
        action: 'deleted',
        payload: { deletedAt: new Date() },
      });

      return deletedProject;
    }),

  convertToWebsite: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        website: z
          .object({
            domain: z.string().url().optional().nullable(),
            hostingProvider: z.string().optional().nullable(),
            dnsStatus: z
              .enum(['pending', 'propagating', 'active', 'failed'])
              .optional()
              .nullable(),
            goLiveDate: z.string().datetime().optional().nullable(),
            repoUrl: z.string().url().optional().nullable(),
            stagingUrl: z.string().url().optional().nullable(),
          })
          .partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get project name for logging
      const [project] = await ctx.db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, input.id))
        .limit(1);

      await ctx.db
        .update(projects)
        .set({
          type: 'website',
          websiteStatus: 'discovery',
          ...input.website,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, input.id),
            eq(projects.userId, ctx.session.user.id)
          )
        );

      // Log conversion activity
      if (project) {
        await logProjectActivity({
          userId: ctx.session.user.id,
          projectId: input.id,
          projectName: project.name,
          action: 'updated',
          payload: {
            conversion: 'general_to_website',
            websiteData: input.website,
          },
        });
      }

      return { ok: true };
    }),

  convertToGeneral: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get project name for logging
      const [project] = await ctx.db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, input.id))
        .limit(1);

      await ctx.db
        .update(projects)
        .set({
          type: 'general',
          domain: null,
          hostingProvider: null,
          dnsStatus: null,
          goLiveDate: null,
          repoUrl: null,
          stagingUrl: null,
          websiteStatus: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, input.id),
            eq(projects.userId, ctx.session.user.id)
          )
        );

      // Log conversion activity
      if (project) {
        await logProjectActivity({
          userId: ctx.session.user.id,
          projectId: input.id,
          projectName: project.name,
          action: 'updated',
          payload: {
            conversion: 'website_to_general',
          },
        });
      }

      return { ok: true };
    }),

  getVelocity: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Get tasks completed in the last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const completedTasks = await ctx.db
        .select({
          id: tasks.id,
          completedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, input.id),
            eq(tasks.status, 'completed'),
            gte(tasks.updatedAt, fourWeeksAgo)
          )
        );

      // Calculate tasks per week
      const weeksElapsed = 4;
      const tasksPerWeek = completedTasks.length / weeksElapsed;

      // Get previous 4 weeks for trend
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const previousTasks = await ctx.db
        .select({
          id: tasks.id,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, input.id),
            eq(tasks.status, 'completed'),
            gte(tasks.updatedAt, eightWeeksAgo),
            lte(tasks.updatedAt, fourWeeksAgo)
          )
        );

      const previousTasksPerWeek = previousTasks.length / weeksElapsed;
      const trend =
        previousTasksPerWeek > 0
          ? ((tasksPerWeek - previousTasksPerWeek) / previousTasksPerWeek) * 100
          : 0;

      // Generate sparkline data (last 7 days)
      const sparklineData: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayCount = completedTasks.filter((t) => {
          const completedDate = new Date(t.completedAt!);
          return completedDate >= dayStart && completedDate <= dayEnd;
        }).length;

        sparklineData.push(dayCount);
      }

      return {
        tasksPerWeek,
        trend,
        sparklineData,
      };
    }),

  getHealth: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Get all tasks for the project
      const projectTasks = await ctx.db
        .select({
          id: tasks.id,
          status: tasks.status,
          dueDate: tasks.dueDate,
        })
        .from(tasks)
        .where(eq(tasks.projectId, input.id));

      // Count blockers
      const blockers = projectTasks.filter(
        (t) => t.status === 'blocked'
      ).length;

      // Count overdue tasks
      const now = new Date();
      const overdue = projectTasks.filter((t) => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < now;
      }).length;

      // Calculate completion rate
      const total = projectTasks.length;
      const completed = projectTasks.filter(
        (t) => t.status === 'completed'
      ).length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Determine health status
      let status: 'on-track' | 'at-risk' | 'behind';
      if (blockers > 2 || overdue > 5) {
        status = 'behind';
      } else if (blockers > 0 || overdue > 2 || completionRate < 30) {
        status = 'at-risk';
      } else {
        status = 'on-track';
      }

      return {
        status,
        blockers,
        overdue,
        completionRate,
      };
    }),
});
