/**
 * Slack Router
 * tRPC routes for Slack integration management
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { slackIntegrations } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const slackRouter = createTRPCRouter({
  // Get current user's Slack integration
  getIntegration: protectedProcedure.query(async ({ ctx }) => {
    const [integration] = await ctx.db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.userId, ctx.session.user.id))
      .limit(1);

    return integration || null;
  }),

  // Disconnect Slack integration
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const [integration] = await ctx.db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.userId, ctx.session.user.id))
      .limit(1);

    if (!integration) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No Slack integration found',
      });
    }

    await ctx.db
      .update(slackIntegrations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(slackIntegrations.id, integration.id));

    return { success: true };
  }),

  // Update integration settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        dailyStandup: z.boolean().optional(),
        standupChannelId: z.string().optional(),
        notifyOnAssignment: z.boolean().optional(),
        notifyOnDueDate: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [integration] = await ctx.db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.userId, ctx.session.user.id))
        .limit(1);

      if (!integration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No Slack integration found',
        });
      }

      const currentSettings = (integration.settings as any) || {};
      const newSettings = {
        ...currentSettings,
        ...input,
      };

      await ctx.db
        .update(slackIntegrations)
        .set({
          settings: newSettings,
          updatedAt: new Date(),
        })
        .where(eq(slackIntegrations.id, integration.id));

      return { success: true };
    }),

  // Test Slack connection
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    const [integration] = await ctx.db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.userId, ctx.session.user.id))
      .limit(1);

    if (!integration) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No Slack integration found',
      });
    }

    try {
      // Test the connection by calling Slack API
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to test connection');
      }

      return {
        success: true,
        teamName: data.team,
        userName: data.user,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to test connection',
      });
    }
  }),
});
