import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { ideaforgeSyncMap, taskComments, tasks } from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';

const NoteCreateSchema = z.object({
  content: z.string().min(1).max(10000),
  contentHtml: z.string().optional(),
  attachments: z.any().optional(),
});

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = NoteCreateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let taskId = params.id;

  if (!uuidRegex.test(taskId)) {
    const [mapping] = await db
      .select({ taskId: ideaforgeSyncMap.taskId })
      .from(ideaforgeSyncMap)
      .where(
        and(
          eq(ideaforgeSyncMap.userId, authResult.auth.userId),
          eq(ideaforgeSyncMap.planTaskId, params.id)
        )
      )
      .limit(1);

    if (!mapping) {
      return NextResponse.json({ error: 'Task mapping not found' }, { status: 404 });
    }

    taskId = mapping.taskId;
  }

  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, authResult.auth.userId)))
    .limit(1);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const [comment] = await db
    .insert(taskComments)
    .values({
      taskId,
      userId: authResult.auth.userId,
      content: parsed.data.content,
      contentHtml: parsed.data.contentHtml,
      attachments: parsed.data.attachments,
      source: 'ideaforge',
    })
    .returning();

  await db
    .update(ideaforgeSyncMap)
    .set({
      lastChangeSource: 'idea_app',
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(ideaforgeSyncMap.taskId, taskId));

  return NextResponse.json({ comment }, { status: 201 });
}
