import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { notes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Delete note (only if user owns it)
    const [deletedNote] = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
      .returning();

    if (!deletedNote) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
