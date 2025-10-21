import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import { projects, roles } from '@/server/db';
import { eq, and, like, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { upsertEmbedding } from '@/server/search/upsertEmbedding';

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
      const conditions = [];

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

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
        .where(whereClause || eq(projects.id, projects.id))
        .orderBy(projects.createdAt);
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
        .where(eq(projects.id, input.id))
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
      const [row] = await ctx.db.insert(projects).values({
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
      }).returning();

      // Create embedding for search
      await upsertEmbedding({
        entityType: 'project',
        entityId: row.id,
        text: [row.name, row.description ?? '', row.domain ?? '', row.repoUrl ?? ''].join('\n'),
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const [updatedProject] = await ctx.db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return updatedProject;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedProject] = await ctx.db
        .delete(projects)
        .where(eq(projects.id, input.id))
        .returning();

      if (!deletedProject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return deletedProject;
    }),

  convertToWebsite: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid(),
      website: z.object({
        domain: z.string().url().optional().nullable(),
        hostingProvider: z.string().optional().nullable(),
        dnsStatus: z.enum(["pending","propagating","active","failed"]).optional().nullable(),
        goLiveDate: z.string().datetime().optional().nullable(),
        repoUrl: z.string().url().optional().nullable(),
        stagingUrl: z.string().url().optional().nullable(),
      }).partial()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(projects).set({
        type: "website",
        ...input.website,
        updatedAt: new Date(),
      }).where(eq(projects.id, input.id));
      return { ok: true };
    }),

  convertToGeneral: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(projects).set({
        type: "general",
        domain: null,
        hostingProvider: null,
        dnsStatus: null,
        goLiveDate: null,
        repoUrl: null,
        stagingUrl: null,
        updatedAt: new Date(),
      }).where(eq(projects.id, input.id));
      return { ok: true };
    }),
});
