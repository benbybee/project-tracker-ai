import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { opportunities, sprints } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const OpportunityCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MAJOR', 'MICRO']),
  sprintId: z.string().uuid().optional(),
  lane: z.string().optional(),
  summary: z.string().optional(),
  complexity: z.string().optional(),
  estimatedCost: z.string().optional(),
  goToMarket: z.string().optional(),
  details: z.string().optional(),
  priority: z.number().min(1).max(4).optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const sprintId = searchParams.get('sprintId');

  const conditions = [eq(opportunities.userId, authResult.auth.userId)];
  if (status) {
    conditions.push(eq(opportunities.status, status));
  }
  if (sprintId) {
    conditions.push(eq(opportunities.sprintId, sprintId));
  }

  const data = await db
    .select()
    .from(opportunities)
    .where(and(...conditions))
    .orderBy(desc(opportunities.createdAt));

  return NextResponse.json({ opportunities: data });
}

export async function POST(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = OpportunityCreateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.sprintId) {
    const [sprint] = await db
      .select({ id: sprints.id })
      .from(sprints)
      .where(
        and(
          eq(sprints.id, parsed.data.sprintId),
          eq(sprints.userId, authResult.auth.userId)
        )
      )
      .limit(1);

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }
  }

  const [created] = await db
    .insert(opportunities)
    .values({
      userId: authResult.auth.userId,
      name: parsed.data.name,
      type: parsed.data.type,
      sprintId: parsed.data.sprintId,
      lane: parsed.data.lane,
      summary: parsed.data.summary,
      complexity: parsed.data.complexity,
      estimatedCost: parsed.data.estimatedCost,
      goToMarket: parsed.data.goToMarket,
      details: parsed.data.details,
      priority: parsed.data.priority ?? 3,
      notes: parsed.data.notes,
    })
    .returning();

  return NextResponse.json({ opportunity: created }, { status: 201 });
}
