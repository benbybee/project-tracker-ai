import { NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const SprintCreateSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  goalSummary: z.string().optional(),
});

export async function GET(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const data = await db
    .select()
    .from(sprints)
    .where(eq(sprints.userId, authResult.auth.userId))
    .orderBy(desc(sprints.createdAt));

  return NextResponse.json({ sprints: data });
}

export async function POST(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = SprintCreateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await db
    .update(sprints)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(eq(sprints.userId, authResult.auth.userId), eq(sprints.isActive, true))
    );

  const [created] = await db
    .insert(sprints)
    .values({
      userId: authResult.auth.userId,
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      goalSummary: parsed.data.goalSummary,
      isActive: true,
    })
    .returning();

  return NextResponse.json({ sprint: created }, { status: 201 });
}
