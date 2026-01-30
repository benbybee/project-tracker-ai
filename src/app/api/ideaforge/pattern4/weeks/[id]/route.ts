import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints, sprintWeeks } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const WeekUpdateSchema = z.object({
  theme: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = WeekUpdateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [week] = await db
    .select({
      week: sprintWeeks,
      sprint: sprints,
    })
    .from(sprintWeeks)
    .innerJoin(sprints, eq(sprintWeeks.sprintId, sprints.id))
    .where(
      and(eq(sprintWeeks.id, params.id), eq(sprints.userId, authResult.auth.userId))
    )
    .limit(1);

  if (!week) {
    return NextResponse.json({ error: 'Sprint week not found' }, { status: 404 });
  }

  const [updated] = await db
    .update(sprintWeeks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(sprintWeeks.id, params.id))
    .returning();

  return NextResponse.json({ week: updated });
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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
      and(eq(sprintWeeks.id, params.id), eq(sprints.userId, authResult.auth.userId))
    )
    .limit(1);

  if (!week) {
    return NextResponse.json({ error: 'Sprint week not found' }, { status: 404 });
  }

  const [deleted] = await db
    .delete(sprintWeeks)
    .where(eq(sprintWeeks.id, params.id))
    .returning();

  return NextResponse.json({ week: deleted });
}
