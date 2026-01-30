import { createHmac } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { ideaforgeSyncMap } from '@/server/db/schema';
import { logger } from '@/lib/logger';

type TaskWebhookEvent = {
  type:
    | 'task.status_changed'
    | 'task.due_date_changed'
    | 'task.note_added'
    | 'task.updated';
  taskId: string;
  userId: string;
  data: Record<string, unknown>;
};

function getWebhookConfig(): { url: string; secret: string } | null {
  const url = process.env.IDEAFORGE_WEBHOOK_URL;
  const secret = process.env.IDEAFORGE_WEBHOOK_SECRET;
  if (!url || !secret) return null;
  return { url, secret };
}

function signPayload(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export async function emitIdeaForgeTaskWebhook(
  event: TaskWebhookEvent,
  source: 'idea_app' | 'task_app'
): Promise<void> {
  if (source === 'idea_app') return;

  const config = getWebhookConfig();
  if (!config) return;

  const [mapping] = await db
    .select({
      ideaId: ideaforgeSyncMap.ideaId,
      planVersion: ideaforgeSyncMap.planVersion,
      planTaskId: ideaforgeSyncMap.planTaskId,
      taskId: ideaforgeSyncMap.taskId,
    })
    .from(ideaforgeSyncMap)
    .where(
      and(
        eq(ideaforgeSyncMap.userId, event.userId),
        eq(ideaforgeSyncMap.taskId, event.taskId)
      )
    )
    .limit(1);

  if (!mapping) return;

  const payload = {
    type: event.type,
    ideaId: mapping.ideaId,
    planVersion: mapping.planVersion,
    planTaskId: mapping.planTaskId,
    taskId: mapping.taskId,
    occurredAt: new Date().toISOString(),
    data: event.data,
  };

  const body = JSON.stringify(payload);
  const signature = signPayload(body, config.secret);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IdeaForge-Signature': signature,
      },
      body,
    });

    if (!response.ok) {
      logger.warn('IdeaForge webhook failed', {
        status: response.status,
        statusText: response.statusText,
        type: event.type,
      });
    }

    await db
      .update(ideaforgeSyncMap)
      .set({
        lastChangeSource: 'task_app',
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(ideaforgeSyncMap.taskId, event.taskId));
  } catch (error) {
    logger.error('IdeaForge webhook error', error, { type: event.type });
  }
}
