import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { users } from '@/server/db';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }): Promise<any> => {
    const user = await ctx.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);

    if (!user[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user[0];
  }),

  // Update user profile (name and/or email)
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<any> => {
      const { name, email } = input;

      // If email is being updated, check if it's already taken
      if (email) {
        const existingUser = await ctx.db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser[0] && existingUser[0].id !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }
      }

      // Build update object with only provided fields
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (name !== undefined) {
        updateData.name = name;
      }

      if (email !== undefined) {
        updateData.email = email;
      }

      // Update user
      const [updatedUser] = await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.session.user.id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          updatedAt: users.updatedAt,
        });

      return updatedUser;
    }),

  // Change password
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z
          .string()
          .min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ input, ctx }): Promise<{ success: boolean }> => {
      const { currentPassword, newPassword } = input;

      // Get current user with password hash
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.session.user.id))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user[0].passwordHash
      );

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await ctx.db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.session.user.id));

      return { success: true };
    }),
});
