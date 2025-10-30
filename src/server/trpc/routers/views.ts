/**
 * Views Router
 * tRPC routes for managing saved views
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { savedViews } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Filter validation schemas
const filterConditionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    field: z.string(),
    operator: z.enum([
      'equals',
      'contains',
      'in',
      'gt',
      'lt',
      'gte',
      'lte',
      'between',
      'exists',
      'not_exists',
    ]),
    value: z.any(),
  })
);

const filterGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    operator: z.enum(['AND', 'OR', 'NOT']),
    conditions: z.array(z.union([filterConditionSchema, filterGroupSchema])),
  })
);

export const viewsRouter = createTRPCRouter({
  // List all views for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(savedViews)
      .where(eq(savedViews.userId, ctx.session.user.id))
      .orderBy(desc(savedViews.createdAt));
  }),

  // Get a specific view by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [view] = await ctx.db
        .select()
        .from(savedViews)
        .where(
          and(
            eq(savedViews.id, input.id),
            eq(savedViews.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!view) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'View not found',
        });
      }

      return view;
    }),

  // Create a new view
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        viewType: z.enum(['board', 'dashboard', 'calendar', 'list']),
        filters: filterGroupSchema,
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // If setting as default, unset other defaults
      if (input.isDefault) {
        await ctx.db
          .update(savedViews)
          .set({ isDefault: false })
          .where(
            and(
              eq(savedViews.userId, ctx.session.user.id),
              eq(savedViews.viewType, input.viewType)
            )
          );
      }

      const [view] = await ctx.db
        .insert(savedViews)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          viewType: input.viewType,
          filters: input.filters,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
          isDefault: input.isDefault || false,
        })
        .returning();

      return view;
    }),

  // Update an existing view
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        filters: filterGroupSchema.optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const [existing] = await ctx.db
        .select()
        .from(savedViews)
        .where(
          and(
            eq(savedViews.id, input.id),
            eq(savedViews.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'View not found',
        });
      }

      // If setting as default, unset other defaults
      if (input.isDefault) {
        await ctx.db
          .update(savedViews)
          .set({ isDefault: false })
          .where(
            and(
              eq(savedViews.userId, ctx.session.user.id),
              eq(savedViews.viewType, existing.viewType)
            )
          );
      }

      const [updated] = await ctx.db
        .update(savedViews)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(savedViews.id, input.id))
        .returning();

      return updated;
    }),

  // Delete a view
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const [existing] = await ctx.db
        .select()
        .from(savedViews)
        .where(
          and(
            eq(savedViews.id, input.id),
            eq(savedViews.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'View not found',
        });
      }

      await ctx.db.delete(savedViews).where(eq(savedViews.id, input.id));

      return { success: true };
    }),

  // Set a view as default
  setDefault: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const [existing] = await ctx.db
        .select()
        .from(savedViews)
        .where(
          and(
            eq(savedViews.id, input.id),
            eq(savedViews.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'View not found',
        });
      }

      // Unset other defaults for this view type
      await ctx.db
        .update(savedViews)
        .set({ isDefault: false })
        .where(
          and(
            eq(savedViews.userId, ctx.session.user.id),
            eq(savedViews.viewType, existing.viewType)
          )
        );

      // Set this one as default
      const [updated] = await ctx.db
        .update(savedViews)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(savedViews.id, input.id))
        .returning();

      return updated;
    }),

  // Get default view for a view type
  getDefault: protectedProcedure
    .input(
      z.object({
        viewType: z.enum(['board', 'dashboard', 'calendar', 'list']),
      })
    )
    .query(async ({ input, ctx }) => {
      const [view] = await ctx.db
        .select()
        .from(savedViews)
        .where(
          and(
            eq(savedViews.userId, ctx.session.user.id),
            eq(savedViews.viewType, input.viewType),
            eq(savedViews.isDefault, true)
          )
        )
        .limit(1);

      return view || null;
    }),
});
