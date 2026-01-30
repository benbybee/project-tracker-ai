import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import {
  ideaforgeSyncMap,
  projects,
  tasks,
} from '@/server/db/schema';
import { requireIdeaForgeAuth, parseJsonBody } from '@/lib/ideaforge';
import { getOrCreateIdeaForgeProject } from '@/lib/ideaforge-project';
import { upsertEmbedding } from '@/server/search/upsertEmbedding';

const TaskSyncItemSchema = z.object({
  planTaskId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  priority: z.number().min(1).max(4).optional(),
  budgetPlanned: z.string().optional().nullable(),
  sprintId: z.string().uuid().optional().nullable(),
  sprintWeekId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  projectName: z.string().optional(),
});

const TaskSyncSchema = z.object({
  ideaId: z.string().min(1),
  planVersion: z.string().min(1),
  tasks: z.array(TaskSyncItemSchema).min(1),
});

function toPriorityScore(priority?: number) {
  if (!priority) return '3';
  return priority.toString() as '1' | '2' | '3' | '4';
}

export async function POST(req: Request) {
  const authResult = await requireIdeaForgeAuth(req);
  if ('response' in authResult) return authResult.response;

  const body = await parseJsonBody(req);
  if ('response' in body) return body.response;

  const parsed = TaskSyncSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { ideaId, planVersion, tasks: incomingTasks } = parsed.data;
  const now = new Date();

  const results: Array<{ planTaskId: string; taskId: string; created: boolean }> =
    [];

  for (const taskInput of incomingTasks) {
    let projectId = taskInput.projectId || null;

    if (projectId) {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.userId, authResult.auth.userId)
          )
        )
        .limit(1);

      if (!project) {
        projectId = null;
      }
    }

    if (!projectId) {
      const project = await getOrCreateIdeaForgeProject({
        userId: authResult.auth.userId,
        projectName: taskInput.projectName,
      });
      projectId = project.id;
    }

    const [mapping] = await db
      .select()
      .from(ideaforgeSyncMap)
      .where(
        and(
          eq(ideaforgeSyncMap.userId, authResult.auth.userId),
          eq(ideaforgeSyncMap.planTaskId, taskInput.planTaskId),
          eq(ideaforgeSyncMap.ideaId, ideaId)
        )
      )
      .limit(1);

    if (mapping) {
      const [updated] = await db
        .update(tasks)
        .set({
          title: taskInput.title,
          description: taskInput.description ?? null,
          priorityScore: toPriorityScore(taskInput.priority),
          priority: taskInput.priority ?? null,
          dueDate: taskInput.dueDate ?? null,
          projectId: projectId,
          sprintId: taskInput.sprintId ?? null,
          sprintWeekId: taskInput.sprintWeekId ?? null,
          opportunityId: taskInput.opportunityId ?? null,
          budgetPlanned: taskInput.budgetPlanned ?? null,
          updatedAt: now,
        })
        .where(
          and(
            eq(tasks.id, mapping.taskId),
            eq(tasks.userId, authResult.auth.userId)
          )
        )
        .returning();

      if (updated) {
        await upsertEmbedding({
          entityType: 'task',
          entityId: updated.id,
          text: [updated.title, updated.description ?? ''].join('\n'),
        });

        await db
          .update(ideaforgeSyncMap)
          .set({
            planVersion,
            projectId,
            sprintId: taskInput.sprintId ?? null,
            sprintWeekId: taskInput.sprintWeekId ?? null,
            opportunityId: taskInput.opportunityId ?? null,
            lastSyncAt: now,
            lastChangeSource: 'idea_app',
            updatedAt: now,
          })
          .where(eq(ideaforgeSyncMap.id, mapping.id));

        results.push({
          planTaskId: taskInput.planTaskId,
          taskId: mapping.taskId,
          created: false,
        });
        continue;
      }
    }

    const [created] = await db
      .insert(tasks)
      .values({
        userId: authResult.auth.userId,
        projectId,
        title: taskInput.title,
        description: taskInput.description ?? null,
        status: 'not_started',
        priorityScore: toPriorityScore(taskInput.priority),
        priority: taskInput.priority ?? null,
        dueDate: taskInput.dueDate ?? null,
        sprintId: taskInput.sprintId ?? null,
        sprintWeekId: taskInput.sprintWeekId ?? null,
        opportunityId: taskInput.opportunityId ?? null,
        budgetPlanned: taskInput.budgetPlanned ?? null,
      })
      .returning();

    await upsertEmbedding({
      entityType: 'task',
      entityId: created.id,
      text: [created.title, created.description ?? ''].join('\n'),
    });

    if (mapping) {
      await db
        .update(ideaforgeSyncMap)
        .set({
          taskId: created.id,
          projectId,
          sprintId: taskInput.sprintId ?? null,
          sprintWeekId: taskInput.sprintWeekId ?? null,
          opportunityId: taskInput.opportunityId ?? null,
          lastSyncAt: now,
          lastChangeSource: 'idea_app',
          updatedAt: now,
        })
        .where(eq(ideaforgeSyncMap.id, mapping.id));
    } else {
      await db.insert(ideaforgeSyncMap).values({
        userId: authResult.auth.userId,
        ideaId,
        planVersion,
        planTaskId: taskInput.planTaskId,
        taskId: created.id,
        projectId,
        sprintId: taskInput.sprintId ?? null,
        sprintWeekId: taskInput.sprintWeekId ?? null,
        opportunityId: taskInput.opportunityId ?? null,
        lastSyncAt: now,
        lastChangeSource: 'idea_app',
        createdAt: now,
        updatedAt: now,
      });
    }

    results.push({
      planTaskId: taskInput.planTaskId,
      taskId: created.id,
      created: true,
    });
  }

  return NextResponse.json({
    ideaId,
    planVersion,
    mappedTasks: results,
    syncedAt: now.toISOString(),
  });
}
