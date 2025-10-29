import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { users } from '@/server/db';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      // Check if user already exists
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser[0]) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const [newUser] = await ctx.db
        .insert(users)
        .values({
          email,
          passwordHash,
        })
        .returning();

      return {
        id: newUser.id,
        email: newUser.email,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user[0].passwordHash
      );

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      return {
        id: user[0].id,
        email: user[0].email,
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return null;
    }

    const user = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);

    return user[0] || null;
  }),
});
