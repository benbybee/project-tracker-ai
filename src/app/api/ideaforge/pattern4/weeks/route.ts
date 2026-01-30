import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints, sprintWeeks } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const WeekCreateSchema = z.object({
  sprintId: z.string().uuid(),
  weekIndex: z.number().min(1).max(13),
  startDate: z.string(),
  endDate: z.string(),
  theme: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const { searchParams } = new URL(req.url);
  const sprintId = searchParams.get('sprintId');
  if (!sprintId) {
    return NextResponse.json(
      { error: 'Missing sprintId parameter' },
      { status: 400 }
    );
  }

  const [sprint] = await db
    .select({ id: sprints.id })
    .from(sprints)
    .where(
      and(eq(sprints.id, sprintId), eq(sprints.userId, authResult.auth.userId))
    )
    .limit(1);

  if (!sprint) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  const weeks = await db
    .select()
    .from(sprintWeeks)
    .where(eq(sprintWeeks.sprintId, sprintId))
    .orderBy(sprintWeeks.weekIndex);

  return NextResponse.json({ weeks });
}

export async function POST(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = WeekCreateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

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

  const [created] = await db
    .insert(sprintWeeks)
    .values({
      sprintId: parsed.data.sprintId,
      weekIndex: parsed.data.weekIndex,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      theme: parsed.data.theme,
      notes: parsed.data.notes,
    })
    .returning();

  return NextResponse.json({ week: created }, { status: 201 });
}
