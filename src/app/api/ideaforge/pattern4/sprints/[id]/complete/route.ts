import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { sprints } from '@/server/db/schema';
import { requireIdeaForgeAuth } from '@/lib/ideaforge';

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const [updated] = await db
    .update(sprints)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(eq(sprints.id, params.id), eq(sprints.userId, authResult.auth.userId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  return NextResponse.json({ sprint: updated });
}
