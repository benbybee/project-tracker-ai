import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { roles } from '@/server/db';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const rolesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(roles).orderBy(roles.name);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [newRole] = await ctx.db
        .insert(roles)
        .values(input)
        .returning();

      return newRole;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const [updatedRole] = await ctx.db
        .update(roles)
        .set(updateData)
        .where(eq(roles.id, id))
        .returning();

      if (!updatedRole) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Role not found',
        });
      }

      return updatedRole;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedRole] = await ctx.db
        .delete(roles)
        .where(eq(roles.id, input.id))
        .returning();

      if (!deletedRole) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Role not found',
        });
      }

      return deletedRole;
    }),
});
