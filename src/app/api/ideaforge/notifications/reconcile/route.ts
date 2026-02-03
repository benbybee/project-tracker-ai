import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, tasks } from '@/server/db/schema';
import {
  ideaforgeIdeas,
  ideaforgeNotifications,
  ideaforgePlanTasks,
} from '@/server/db/schema/ideaforge';
import { and, eq, gte, lte, lt, ne, isNotNull } from 'drizzle-orm';

function toDateOnlyString(date: Date) {
  return date.toISOString().split('T')[0];
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allUsers = await db.select({ id: users.id }).from(users);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toDateOnlyString(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toDateOnlyString(tomorrow);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekStart = startOfWeek(today);
    const weekKey = toDateOnlyString(weekStart);

    const results = {
      processed: allUsers.length,
      dueSoon: 0,
      overdue: 0,
      stalled: 0,
    };

    for (const user of allUsers) {
      // Due soon (within 24 hours)
      const dueSoonTasks = await db
        .select({
          id: ideaforgePlanTasks.id,
          ideaId: ideaforgePlanTasks.ideaId,
          dueDate: ideaforgePlanTasks.dueDate,
        })
        .from(ideaforgePlanTasks)
        .leftJoin(tasks, eq(ideaforgePlanTasks.taskId, tasks.id))
        .where(
          and(
            eq(ideaforgePlanTasks.userId, user.id),
            isNotNull(ideaforgePlanTasks.dueDate),
            gte(ideaforgePlanTasks.dueDate, todayStr),
            lte(ideaforgePlanTasks.dueDate, tomorrowStr),
            ne(tasks.status, 'completed')
          )
        );

      for (const task of dueSoonTasks) {
        const windowKey = `due_soon:${task.id}:${todayStr}`;
        const [existing] = await db
          .select({ id: ideaforgeNotifications.id })
          .from(ideaforgeNotifications)
          .where(
            and(
              eq(ideaforgeNotifications.userId, user.id),
              eq(ideaforgeNotifications.windowKey, windowKey)
            )
          )
          .limit(1);

        if (!existing) {
          await db.insert(ideaforgeNotifications).values({
            userId: user.id,
            ideaId: task.ideaId,
            planTaskId: task.id,
            type: 'due_soon',
            windowKey,
          });
          results.dueSoon += 1;
        }
      }

      // Overdue (past due date)
      const overdueTasks = await db
        .select({
          id: ideaforgePlanTasks.id,
          ideaId: ideaforgePlanTasks.ideaId,
          dueDate: ideaforgePlanTasks.dueDate,
        })
        .from(ideaforgePlanTasks)
        .leftJoin(tasks, eq(ideaforgePlanTasks.taskId, tasks.id))
        .where(
          and(
            eq(ideaforgePlanTasks.userId, user.id),
            isNotNull(ideaforgePlanTasks.dueDate),
            lt(ideaforgePlanTasks.dueDate, todayStr),
            ne(tasks.status, 'completed')
          )
        );

      for (const task of overdueTasks) {
        const windowKey = `overdue:${task.id}:${todayStr}`;
        const [existing] = await db
          .select({ id: ideaforgeNotifications.id })
          .from(ideaforgeNotifications)
          .where(
            and(
              eq(ideaforgeNotifications.userId, user.id),
              eq(ideaforgeNotifications.windowKey, windowKey)
            )
          )
          .limit(1);

        if (!existing) {
          await db.insert(ideaforgeNotifications).values({
            userId: user.id,
            ideaId: task.ideaId,
            planTaskId: task.id,
            type: 'overdue',
            windowKey,
          });
          results.overdue += 1;
        }
      }

      // Stalled ideas (no updates for 7 days while planned/executing)
      const stalledIdeas = await db
        .select({
          id: ideaforgeIdeas.id,
        })
        .from(ideaforgeIdeas)
        .where(
          and(
            eq(ideaforgeIdeas.userId, user.id),
            lt(ideaforgeIdeas.updatedAt, sevenDaysAgo),
            eq(ideaforgeIdeas.status, 'PLANNED')
          )
        );

      const stalledExecuting = await db
        .select({
          id: ideaforgeIdeas.id,
        })
        .from(ideaforgeIdeas)
        .where(
          and(
            eq(ideaforgeIdeas.userId, user.id),
            lt(ideaforgeIdeas.updatedAt, sevenDaysAgo),
            eq(ideaforgeIdeas.status, 'EXECUTING')
          )
        );

      for (const idea of [...stalledIdeas, ...stalledExecuting]) {
        const windowKey = `stalled:${idea.id}:${weekKey}`;
        const [existing] = await db
          .select({ id: ideaforgeNotifications.id })
          .from(ideaforgeNotifications)
          .where(
            and(
              eq(ideaforgeNotifications.userId, user.id),
              eq(ideaforgeNotifications.windowKey, windowKey)
            )
          )
          .limit(1);

        if (!existing) {
          await db.insert(ideaforgeNotifications).values({
            userId: user.id,
            ideaId: idea.id,
            type: 'stalled',
            windowKey,
          });
          results.stalled += 1;
        }
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    console.error('IdeaForge notifications reconcile error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reconcile notifications' },
      { status: 500 }
    );
  }
}
