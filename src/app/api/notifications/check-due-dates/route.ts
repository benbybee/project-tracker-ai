import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, tasks, projects, notifications } from '@/server/db/schema';
import { and, eq, gte, lte, lt, ne } from 'drizzle-orm';
import { activityLogger } from '@/lib/activity-logger';
import { logger } from '@/lib/logger';

/**
 * Daily Notification Check Cron Job
 *
 * This endpoint should be called daily (e.g., via Vercel Cron)
 * to check for:
 * 1. Tasks due today (task_reminder)
 * 2. Tasks due in 1-2 days (due_date_approaching)
 * 3. Tasks blocked or in client review for >2 days (sync_conflict)
 *
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/notifications/check-due-dates",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 */

export async function POST(request: Request) {
  try {
    // ✅ RE-ENABLED - Phase 6: Due date functionality rebuilt
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting daily notification check job');

    // Get all users
    const allUsers = await db.select({ id: users.id }).from(users);
    logger.info(`Found ${allUsers.length} users to process`);

    const results = {
      total: allUsers.length,
      dueTodayCount: 0,
      dueSoonCount: 0,
      staleBlockedCount: 0,
      staleClientReviewCount: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Process each user
    for (const user of allUsers) {
      try {
        logger.info(`Checking notifications for user: ${user.id}`);

        // 1. Find tasks due today
        const tasksToday = await db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, user.id),
              eq(tasks.dueDate, todayStr),
              ne(tasks.status, 'completed'),
              eq(tasks.archived, false)
            )
          );

        logger.info(
          `User ${user.id}: Found ${tasksToday.length} tasks due today`
        );

        // Create notifications for tasks due today
        for (const task of tasksToday) {
          // Check if we already sent a notification for this task today
          const existingNotif = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, user.id),
                eq(notifications.type, 'task_reminder'),
                gte(notifications.createdAt, today)
              )
            )
            .limit(1);

          // Only send if we haven't already notified today
          if (existingNotif.length === 0) {
            await activityLogger.createNotification({
              userId: user.id,
              type: 'task_reminder',
              title: '📋 Task due today',
              message: `"${task.title}" is due today`,
              link: `/projects/${task.projectId}`,
              metadata: {
                taskId: task.id,
                dueDate: task.dueDate,
              },
            });
            results.dueTodayCount++;
          }
        }

        // 2. Find tasks due in next 1-2 days
        const tasksSoon = await db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, user.id),
              gte(tasks.dueDate, tomorrowStr),
              lte(tasks.dueDate, dayAfterStr),
              ne(tasks.status, 'completed'),
              eq(tasks.archived, false)
            )
          );

        logger.info(
          `User ${user.id}: Found ${tasksSoon.length} tasks due soon`
        );

        // Create notifications for tasks due soon
        for (const task of tasksSoon) {
          // Check if we already sent a notification for this task today
          const existingNotif = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, user.id),
                eq(notifications.type, 'due_date_approaching'),
                gte(notifications.createdAt, today)
              )
            )
            .limit(1);

          if (existingNotif.length === 0) {
            const daysUntil = task.dueDate === tomorrowStr ? 1 : 2;
            await activityLogger.createNotification({
              userId: user.id,
              type: 'due_date_approaching',
              title: '⏰ Due date approaching',
              message: `"${task.title}" is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
              link: `/projects/${task.projectId}`,
              metadata: {
                taskId: task.id,
                dueDate: task.dueDate,
                daysUntil,
              },
            });
            results.dueSoonCount++;
          }
        }

        // 3. Find tasks that have been blocked for >2 days
        const staleBlockedTasks = await db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, user.id),
              eq(tasks.status, 'blocked'),
              lt(tasks.blockedAt, twoDaysAgo),
              eq(tasks.archived, false)
            )
          );

        logger.info(
          `User ${user.id}: Found ${staleBlockedTasks.length} stale blocked tasks`
        );

        // Create notifications for stale blocked tasks
        for (const task of staleBlockedTasks) {
          // Check if we already sent a notification for this task today
          const existingNotif = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, user.id),
                eq(notifications.type, 'sync_conflict'),
                gte(notifications.createdAt, today)
              )
            )
            .limit(1);

          if (existingNotif.length === 0) {
            const daysSince = Math.floor(
              (today.getTime() - new Date(task.blockedAt!).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            await activityLogger.createNotification({
              userId: user.id,
              type: 'sync_conflict',
              title: '⚠️ Task needs attention',
              message: `"${task.title}" has been blocked for ${daysSince} days`,
              link: `/projects/${task.projectId}`,
              metadata: {
                taskId: task.id,
                status: 'blocked',
                daysSince,
                blockedReason: task.blockedReason,
              },
            });
            results.staleBlockedCount++;
          }
        }

        // 4. Find projects in client_review for >2 days
        const staleClientReviewProjects = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.userId, user.id),
              eq(projects.websiteStatus, 'client_review'),
              lt(projects.updatedAt, twoDaysAgo)
            )
          );

        logger.info(
          `User ${user.id}: Found ${staleClientReviewProjects.length} projects in client review >2 days`
        );

        // Create notifications for stale client review projects
        for (const project of staleClientReviewProjects) {
          // Check if we already sent a notification for this project today
          const existingNotif = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, user.id),
                eq(notifications.type, 'sync_conflict'),
                gte(notifications.createdAt, today)
              )
            )
            .limit(1);

          if (existingNotif.length === 0) {
            const daysSince = Math.floor(
              (today.getTime() - new Date(project.updatedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            await activityLogger.createNotification({
              userId: user.id,
              type: 'sync_conflict',
              title: '⏳ Project awaiting review',
              message: `"${project.name}" has been in client review for ${daysSince} days`,
              link: `/projects/${project.id}`,
              metadata: {
                projectId: project.id,
                status: 'client_review',
                daysSince,
              },
            });
            results.staleClientReviewCount++;
          }
        }
      } catch (error: any) {
        logger.error(`Failed to check notifications for user ${user.id}`, {
          error: error.message,
          userId: user.id,
        });
        results.errors.push({
          userId: user.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    logger.info('Notification check job completed', results);

    return NextResponse.json({
      success: true,
      message: 'Notification check job completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Notification Check] Job failed:', error);
    return NextResponse.json(
      {
        error: error.message || 'Notification check job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual triggers and status checks
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'ready',
      message:
        'Notification check endpoint is ready. Use POST to trigger the job.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
