import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints, tasks } from '@/server/db/schema';
import { requireIdeaForgeAuth } from '@/lib/ideaforge';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [sprint] = await db
    .select({ id: sprints.id })
    .from(sprints)
    .where(
      and(eq(sprints.id, params.id), eq(sprints.userId, authResult.auth.userId))
    )
    .limit(1);

  if (!sprint) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  const sprintTasks = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(
      and(
        eq(tasks.sprintId, params.id),
        eq(tasks.userId, authResult.auth.userId)
      )
    );

  const totalTasks = sprintTasks.length;
  const completedTasks = sprintTasks.filter(
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
