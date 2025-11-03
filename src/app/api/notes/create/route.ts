import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { notes, projects, noteAttachments } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a FormData request (with files) or JSON
    const contentType = req.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    let projectId: string;
    let title: string;
    let content: string;
    let noteType = 'text';
    let audioUrl: string | null = null;
    let audioDuration: number | null = null;
    let files: File[] = [];

    if (isFormData) {
      const formData = await req.formData();
      projectId = String(formData.get('projectId') || '');
      title = String(formData.get('title') || '');
      content = String(formData.get('content') || '');
      noteType = String(formData.get('noteType') || 'text');
      const audioUrlValue = formData.get('audioUrl');
      audioUrl = audioUrlValue ? String(audioUrlValue) : null;
      const audioDurationValue = formData.get('audioDuration');
      audioDuration = audioDurationValue ? Number(audioDurationValue) : null;
      files = formData.getAll('files') as File[];
    } else {
      const body = await req.json();
      projectId = body.projectId;
      title = body.title;
      content = body.content;
      noteType = body.noteType || 'text';
      audioUrl = body.audioUrl || null;
      audioDuration = body.audioDuration || null;
    }

    // Validate required fields
    if (!projectId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create note
    const [newNote] = await db
      .insert(notes)
      .values({
        userId: session.user.id,
        projectId,
        title,
        content,
        noteType,
        audioUrl,
        audioDuration,
        tasksGenerated: false,
      })
      .returning();

    // Upload and store attachments if present
    if (files.length > 0) {
      const attachmentPromises = files
        .filter((f) => f.size > 0)
        .map(async (file) => {
          try {
            // Upload file to Vercel Blob
            const blob = await put(`notes/${newNote.id}/${file.name}`, file, {
              access: 'public',
            });

            // Store attachment metadata in database
            return db.insert(noteAttachments).values({
              noteId: newNote.id,
              fileName: file.name,
              fileSize: file.size,
              url: blob.url,
            });
          } catch (error) {
            console.error('Failed to upload file:', file.name, error);
            // Store without URL if upload fails
            return db.insert(noteAttachments).values({
              noteId: newNote.id,
              fileName: file.name,
              fileSize: file.size,
              url: null,
            });
          }
        });

      await Promise.all(attachmentPromises);
    }

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
