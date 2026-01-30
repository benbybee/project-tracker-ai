import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const SprintUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  goalSummary: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [sprint] = await db
    .select()
    .from(sprints)
    .where(
      and(eq(sprints.id, params.id), eq(sprints.userId, authResult.auth.userId))
    )
    .limit(1);

  if (!sprint) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  return NextResponse.json({ sprint });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = SprintUpdateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(sprints)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(eq(sprints.id, params.id), eq(sprints.userId, authResult.auth.userId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  return NextResponse.json({ sprint: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [deleted] = await db
    .delete(sprints)
    .where(
      and(eq(sprints.id, params.id), eq(sprints.userId, authResult.auth.userId))
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  return NextResponse.json({ sprint: deleted });
}
