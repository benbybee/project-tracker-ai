import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { opportunities, tasks } from '@/server/db/schema';
import { requireIdeaForgeAuth } from '@/lib/ideaforge';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [opportunity] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.id, params.id),
        eq(opportunities.userId, authResult.auth.userId)
      )
    )
    .limit(1);

  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  const opportunityTasks = await db
    .select({
      status: tasks.status,
      budgetPlanned: tasks.budgetPlanned,
      budgetSpent: tasks.budgetSpent,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.opportunityId, params.id),
        eq(tasks.userId, authResult.auth.userId)
      )
    );

  const totalTasks = opportunityTasks.length;
  const completedTasks = opportunityTasks.filter(
    (t) => t.status === 'completed'
  ).length;

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalBudgetPlanned = opportunityTasks.reduce((sum, task) => {
    return sum + (parseFloat(task.budgetPlanned || '0') || 0);
  }, 0);

  const totalBudgetSpent = opportunityTasks.reduce((sum, task) => {
    return sum + (parseFloat(task.budgetSpent || '0') || 0);
  }, 0);

  return NextResponse.json({
    totalTasks,
    completedTasks,
    completionPercentage,
    totalBudgetPlanned: totalBudgetPlanned.toFixed(2),
    totalBudgetSpent: totalBudgetSpent.toFixed(2),
  });
}
