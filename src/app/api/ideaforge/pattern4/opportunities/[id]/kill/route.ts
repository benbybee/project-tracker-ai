import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { opportunities } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const OpportunityKillSchema = z.object({
  outcomeNotes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = OpportunityKillSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(opportunities)
    .set({
      status: 'KILLED',
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
