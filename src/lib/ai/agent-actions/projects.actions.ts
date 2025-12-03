import { z } from 'zod';
import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { eq, like, or } from 'drizzle-orm';
import { upsertEmbedding } from '@/server/search/upsertEmbedding';
import { logProjectActivity } from '@/lib/activity-logger';

const CreateProjectSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['general', 'website']),
  description: z.string().optional(),
  domain: z.string().optional(),
});

const UpdateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  domain: z.string().optional(),
});

const DeleteProjectSchema = z.object({
  projectId: z.string(),
});

const SearchProjectsSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['general', 'website']).optional(),
});

export async function executeCreateProject(params: {
  userId: string;
  name: string;
  type: 'general' | 'website';
  description?: string;
  domain?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = CreateProjectSchema.parse(params);

    const [project] = await db
      .insert(projects)
      .values({
        userId: params.userId,
        name: validated.name,
        type: validated.type,
        description: validated.description || '',
        domain: validated.domain || null,
        websiteStatus: validated.type === 'website' ? 'discovery' : null,
      })
      .returning();

    // Create embedding for search
    await upsertEmbedding({
      entityType: 'project',
      entityId: project.id,
      text: [project.name, project.description || ''].join('\n'),
    });

    // Log activity
    await logProjectActivity({
      userId: params.userId,
      projectId: project.id,
      projectName: project.name,
      action: 'created',
    });

    return { success: true, data: project };
  } catch (error: any) {
    console.error('[ProjectActions] Create project error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create project',
    };
  }
}

export async function executeUpdateProject(params: {
  userId: string;
  projectId: string;
  name?: string;
  description?: string;
  domain?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = UpdateProjectSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, validated.projectId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Project not found' };
    }

    if (existing.userId !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const [updated] = await db
      .update(projects)
      .set({
        name: validated.name || existing.name,
        description: validated.description || existing.description,
        domain: validated.domain || existing.domain,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, validated.projectId))
      .returning();

    // Update embedding
    await upsertEmbedding({
      entityType: 'project',
      entityId: updated.id,
      text: [updated.name, updated.description || ''].join('\n'),
    });

    // Log activity
    await logProjectActivity({
      userId: params.userId,
      projectId: updated.id,
      projectName: updated.name,
      action: 'updated',
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('[ProjectActions] Update project error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update project',
    };
  }
}

export async function executeDeleteProject(params: {
  userId: string;
  projectId: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = DeleteProjectSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, validated.projectId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Project not found' };
    }

    if (existing.userId !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete will cascade to tasks, notes, etc.
    await db.delete(projects).where(eq(projects.id, validated.projectId));

    // Log activity
    await logProjectActivity({
      userId: params.userId,
      projectId: existing.id,
      projectName: existing.name,
      action: 'deleted',
    });

    return {
      success: true,
      data: { message: `Project "${existing.name}" deleted successfully` },
    };
  } catch (error: any) {
    console.error('[ProjectActions] Delete project error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete project',
    };
  }
}

export async function executeSearchProjects(params: {
  userId: string;
  query?: string;
  type?: 'general' | 'website';
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = SearchProjectsSchema.parse(params);

    const conditions = [eq(projects.userId, params.userId)];

    if (validated.query) {
      conditions.push(
        or(
          like(projects.name, `%${validated.query}%`),
          like(projects.description, `%${validated.query}%`)
        ) as any
      );
    }

    if (validated.type) {
      conditions.push(eq(projects.type, validated.type));
    }

    const results = await db
      .select()
      .from(projects)
      .where(
        conditions.length > 1 ? (or(...conditions) as any) : conditions[0]
      );

    return { success: true, data: results };
  } catch (error: any) {
    console.error('[ProjectActions] Search projects error:', error);
    return {
      success: false,
      error: error.message || 'Failed to search projects',
    };
  }
}
