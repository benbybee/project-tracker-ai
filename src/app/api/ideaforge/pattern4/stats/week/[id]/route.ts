import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints, sprintWeeks, tasks } from '@/server/db/schema';
import { requireIdeaForgeAuth } from '@/lib/ideaforge';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [week] = await db
    .select({
      week: sprintWeeks,
      sprint: sprints,
    })
    .from(sprintWeeks)
    .innerJoin(sprints, eq(sprintWeeks.sprintId, sprints.id))
    .where(
      and(
        eq(sprintWeeks.id, params.id),
        eq(sprints.userId, authResult.auth.userId)
      )
    )
    .limit(1);

  if (!week) {
    return NextResponse.json({ error: 'Sprint week not found' }, { status: 404 });
  }

  const weekTasks = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(
      and(
        eq(tasks.sprintWeekId, params.id),
        eq(tasks.userId, authResult.auth.userId)
      )
    );

  const totalTasks = weekTasks.length;
  const completedTasks = weekTasks.filter(
    (t) => t.status === 'completed'
  ).length;

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return NextResponse.json({
    totalTasks,
    completedTasks,
    completionPercentage,
  });
}
