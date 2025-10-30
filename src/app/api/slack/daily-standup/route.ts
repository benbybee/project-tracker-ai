/**
 * Slack Daily Standup Automation
 * Endpoint: /api/slack/daily-standup
 * CRON job to send daily standup messages
 * Vercel Cron: 0 9 * * * (9 AM daily)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, slackIntegrations, users } from '@/server/db/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { formatDailyStandupBlocks } from '@/lib/slack-utils';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // Verify CRON secret (Vercel Cron jobs include this header)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active Slack integrations
    const integrations = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.isActive, true));

    const results = [];

    for (const integration of integrations) {
      try {
        // Get user info
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, integration.userId))
          .limit(1);

        if (!user) continue;

        // Check settings to see if standup is enabled
        const settings = integration.settings as any;
        if (settings && settings.dailyStandup === false) {
          continue; // Skip if disabled
        }

        // Get today's date range
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        // Get yesterday's date range
        const yesterday = subDays(today, 1);
        const startOfYesterday = startOfDay(yesterday);
        const endOfYesterday = endOfDay(yesterday);

        // Fetch tasks
        const [todayTasks, overdueTasks, completedYesterday] =
          await Promise.all([
            // Today's tasks
            db
              .select()
              .from(tasks)
              .where(
                and(
                  eq(tasks.assigneeId, integration.userId),
                  inArray(tasks.status, ['todo', 'in_progress']),
                  gte(tasks.dueDate, startOfToday),
                  lte(tasks.dueDate, endOfToday)
                )
              )
              .limit(10),

            // Overdue tasks
            db
              .select()
              .from(tasks)
              .where(
                and(
                  eq(tasks.assigneeId, integration.userId),
                  inArray(tasks.status, ['todo', 'in_progress']),
                  lte(tasks.dueDate, today)
                )
              )
              .limit(10),

            // Completed yesterday
            db
              .select()
              .from(tasks)
              .where(
                and(
                  eq(tasks.assigneeId, integration.userId),
                  eq(tasks.status, 'done'),
                  gte(tasks.completedAt, startOfYesterday),
                  lte(tasks.completedAt, endOfYesterday)
                )
              )
              .limit(10),
          ]);

        // Format standup message
        const blocks = formatDailyStandupBlocks({
          userName: user.name || user.email || 'User',
          todayTasks,
          overdueTasks,
          completedYesterday,
        });

        // Send to Slack
        const channelId =
          settings?.standupChannelId || integration.webhookChannelId;

        if (channelId && integration.botAccessToken) {
          const response = await fetch(
            'https://slack.com/api/chat.postMessage',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${integration.botAccessToken}`,
              },
              body: JSON.stringify({
                channel: channelId,
                blocks,
                text: `Daily Standup for ${user.name || user.email}`,
              }),
            }
          );

          const data = await response.json();
          results.push({
            userId: integration.userId,
            success: data.ok,
            error: data.error,
          });
        }
      } catch (error: any) {
        console.error(`Standup error for user ${integration.userId}:`, error);
        results.push({
          userId: integration.userId,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: integrations.length,
      results,
    });
  } catch (error: any) {
    console.error('Daily standup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function for inArray
function inArray(column: any, values: any[]) {
  // This is a simplified implementation
  // In production, use the proper drizzle-orm inArray function
  return eq(column, values[0]); // Placeholder
}
