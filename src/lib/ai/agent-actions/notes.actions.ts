import { z } from 'zod';
import { db } from '@/server/db';
import { notes, projects } from '@/server/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

const CreateNoteSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
});

const UpdateNoteSchema = z.object({
  noteId: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

const DeleteNoteSchema = z.object({
  noteId: z.string(),
});

const SearchNotesSchema = z.object({
  query: z.string().optional(),
  projectId: z.string().optional(),
});

export async function executeCreateNote(params: {
  userId: string;
  projectId?: string;
  projectName?: string;
  title: string;
  content: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = CreateNoteSchema.parse(params);

    let projectId = validated.projectId;

    // If project name provided, look up ID
    if (!projectId && validated.projectName) {
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.userId, params.userId),
            like(projects.name, `%${validated.projectName}%`)
          )
        )
        .limit(1);

      if (project) {
        projectId = project.id;
      } else {
        return {
          success: false,
          error: `Project "${validated.projectName}" not found`,
        };
      }
    }

    if (!projectId) {
      return { success: false, error: 'Project ID or name required' };
    }

    const [note] = await db
      .insert(notes)
      .values({
        userId: params.userId,
        projectId: projectId,
        title: validated.title,
        content: validated.content,
        noteType: 'text',
        tasksGenerated: false,
      })
      .returning();

    return { success: true, data: note };
  } catch (error: any) {
    console.error('[NoteActions] Create note error:', error);
    return { success: false, error: error.message || 'Failed to create note' };
  }
}

export async function executeUpdateNote(params: {
  userId: string;
  noteId: string;
  title?: string;
  content?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = UpdateNoteSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, validated.noteId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Note not found' };
    }

    if (existing.userId !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const [updated] = await db
      .update(notes)
      .set({
        title: validated.title || existing.title,
        content: validated.content || existing.content,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, validated.noteId))
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('[NoteActions] Update note error:', error);
    return { success: false, error: error.message || 'Failed to update note' };
  }
}

export async function executeDeleteNote(params: {
  userId: string;
  noteId: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = DeleteNoteSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, validated.noteId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Note not found' };
    }

    if (existing.userId !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.delete(notes).where(eq(notes.id, validated.noteId));

    return {
      success: true,
      data: { message: `Note "${existing.title}" deleted successfully` },
    };
  } catch (error: any) {
    console.error('[NoteActions] Delete note error:', error);
    return { success: false, error: error.message || 'Failed to delete note' };
  }
}

export async function executeSearchNotes(params: {
  userId: string;
  query?: string;
  projectId?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = SearchNotesSchema.parse(params);

    const conditions = [eq(notes.userId, params.userId)];

    if (validated.query) {
      conditions.push(
        or(
          like(notes.title, `%${validated.query}%`),
          like(notes.content, `%${validated.query}%`)
        ) as any
      );
    }

    if (validated.projectId) {
      conditions.push(eq(notes.projectId, validated.projectId));
    }

    const results = await db
      .select()
      .from(notes)
      .where(and(...conditions));

    return { success: true, data: results };
  } catch (error: any) {
    console.error('[NoteActions] Search notes error:', error);
    return { success: false, error: error.message || 'Failed to search notes' };
  }
}
