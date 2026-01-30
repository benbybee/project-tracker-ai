import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints, sprintWeeks } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';
import { formatDateForSQL, generateSprintWeeks } from '@/lib/pattern4-utils';

const GenerateWeeksSchema = z.object({
  sprintId: z.string().uuid(),
});

export async function POST(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = GenerateWeeksSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [sprint] = await db
    .select()
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

  const existingWeeks = await db
    .select({ id: sprintWeeks.id })
    .from(sprintWeeks)
    .where(eq(sprintWeeks.sprintId, parsed.data.sprintId))
    .limit(1);

  if (existingWeeks.length > 0) {
    return NextResponse.json(
      { error: 'Sprint weeks already generated' },
      { status: 409 }
    );
  }

  const weeks = generateSprintWeeks(new Date(sprint.startDate as any)).map(
    (week) => ({
      sprintId: parsed.data.sprintId,
      weekIndex: week.weekIndex,
      startDate: formatDateForSQL(week.startDate),
      endDate: formatDateForSQL(week.endDate),
    })
  );

  const created = await db.insert(sprintWeeks).values(weeks).returning();

  return NextResponse.json({ weeks: created }, { status: 201 });
}
