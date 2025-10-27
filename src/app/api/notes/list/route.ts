import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { notes, projects } from '@/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    // Build where clause
    const whereClause = projectId
      ? and(eq(notes.userId, session.user.id), eq(notes.projectId, projectId))
      : eq(notes.userId, session.user.id);

    // Fetch notes with project details
    const userNotes = await db
      .select({
        id: notes.id,
        userId: notes.userId,
        projectId: notes.projectId,
        title: notes.title,
        content: notes.content,
        noteType: notes.noteType,
        audioUrl: notes.audioUrl,
        audioDuration: notes.audioDuration,
        tasksGenerated: notes.tasksGenerated,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        projectName: projects.name,
      })
      .from(notes)
      .leftJoin(projects, eq(notes.projectId, projects.id))
      .where(whereClause)
      .orderBy(desc(notes.createdAt));

    return NextResponse.json({ notes: userNotes });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}
