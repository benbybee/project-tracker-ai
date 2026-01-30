import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { opportunities, tasks } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const OpportunityCompleteSchema = z.object({
  actualCost: z.string().optional(),
  revenue: z.string().optional(),
  profit: z.string().optional(),
  decision: z.enum(['KEEP', 'ADJUST', 'CANCEL', 'UNDECIDED']),
  outcomeNotes: z.string().optional(),
});

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = OpportunityCompleteSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const linkedTasks = await db
    .select({ budgetSpent: tasks.budgetSpent })
    .from(tasks)
    .where(
      and(
        eq(tasks.opportunityId, params.id),
        eq(tasks.userId, authResult.auth.userId)
      )
    );

  const totalBudgetSpent = linkedTasks.reduce((sum, task) => {
    return sum + (parseFloat(task.budgetSpent || '0') || 0);
  }, 0);

  const [updated] = await db
    .update(opportunities)
    .set({
      status: 'COMPLETED',
      actualCost: parsed.data.actualCost || totalBudgetSpent.toString(),
      revenue: parsed.data.revenue,
      profit: parsed.data.profit,
      decision: parsed.data.decision,
      outcomeNotes: parsed.data.outcomeNotes,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(opportunities.id, params.id),
        eq(opportunities.userId, authResult.auth.userId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  return NextResponse.json({ opportunity: updated });
}
