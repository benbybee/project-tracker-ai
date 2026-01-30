import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { opportunities, sprints } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const OpportunityUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['MAJOR', 'MICRO']).optional(),
  sprintId: z.string().uuid().optional().nullable(),
  lane: z.string().optional(),
  summary: z.string().optional(),
  complexity: z.string().optional(),
  estimatedCost: z.string().optional(),
  goToMarket: z.string().optional(),
  details: z.string().optional(),
  status: z
    .enum(['IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'KILLED'])
    .optional(),
  priority: z.number().min(1).max(4).optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [opportunity] = await db
    .select()
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

  return NextResponse.json({ opportunity });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = OpportunityUpdateSchema.safeParse(body.data);
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

  const [updated] = await db
    .update(opportunities)
    .set({ ...parsed.data, updatedAt: new Date() })
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [deleted] = await db
    .delete(opportunities)
    .where(
      and(
        eq(opportunities.id, params.id),
        eq(opportunities.userId, authResult.auth.userId)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  return NextResponse.json({ opportunity: deleted });
}
