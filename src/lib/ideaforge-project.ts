import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';

const DEFAULT_PROJECT_NAME = 'IdeaForge';

export async function getOrCreateIdeaForgeProject(params: {
  userId: string;
  projectName?: string;
}) {
  const name = params.projectName || DEFAULT_PROJECT_NAME;

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, params.userId), eq(projects.name, name)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(projects)
    .values({
      userId: params.userId,
      name,
      type: 'general',
    })
    .returning();

  return created;
}
