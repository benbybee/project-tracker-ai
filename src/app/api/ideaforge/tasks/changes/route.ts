import { NextResponse } from 'next/server';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  ideaforgeSyncMap,
  taskComments,
  tasks,
} from '@/server/db/schema';
import { requireIdeaForgeAuth } from '@/lib/ideaforge';

export async function GET(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get('since');
  const since = sinceParam ? new Date(sinceParam) : null;

  if (sinceParam && isNaN(since!.getTime())) {
    return NextResponse.json(
      { error: 'Invalid since parameter' },
      { status: 400 }
    );
  }

  const mappings = await db
    .select({
      planTaskId: ideaforgeSyncMap.planTaskId,
      taskId: ideaforgeSyncMap.taskId,
      ideaId: ideaforgeSyncMap.ideaId,
      planVersion: ideaforgeSyncMap.planVersion,
    })
    .from(ideaforgeSyncMap)
    .where(eq(ideaforgeSyncMap.userId, authResult.auth.userId));

  const taskIds = mappings.map((m) => m.taskId);
  if (taskIds.length === 0) {
    return NextResponse.json({ tasks: [], notes: [], serverTime: new Date().toISOString() });
  }

  const tasksChanged = await db
    .select({
      id: tasks.id,
      status: tasks.status,
      dueDate: tasks.dueDate,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(
      and(
        inArray(tasks.id, taskIds),
        eq(tasks.userId, authResult.auth.userId),
        since ? gt(tasks.updatedAt, since) : gt(tasks.updatedAt, new Date(0))
      )
    );

  const notesChanged = await db
    .select({
      id: taskComments.id,
      taskId: taskComments.taskId,
      content: taskComments.content,
      source: taskComments.source,
      createdAt: taskComments.createdAt,
    })
    .from(taskComments)
    .where(
      and(
        inArray(taskComments.taskId, taskIds),
        since ? gt(taskComments.createdAt, since) : gt(taskComments.createdAt, new Date(0))
      )
    );

  const mappingByTaskId = new Map(
    mappings.map((m) => [m.taskId, m])
  );

  const tasksPayload = tasksChanged.map((task) => {
    const mapping = mappingByTaskId.get(task.id);
    return {
      taskId: task.id,
      planTaskId: mapping?.planTaskId,
      ideaId: mapping?.ideaId,
      planVersion: mapping?.planVersion,
      status: task.status,
      dueDate: task.dueDate,
      updatedAt: task.updatedAt?.toISOString(),
    };
  });

  const notesPayload = notesChanged.map((note) => {
    const mapping = mappingByTaskId.get(note.taskId);
    return {
      commentId: note.id,
      taskId: note.taskId,
      planTaskId: mapping?.planTaskId,
      ideaId: mapping?.ideaId,
      planVersion: mapping?.planVersion,
      content: note.content,
      source: note.source,
      createdAt: note.createdAt?.toISOString(),
    };
  });

  return NextResponse.json({
    tasks: tasksPayload,
    notes: notesPayload,
    serverTime: new Date().toISOString(),
  });
}
