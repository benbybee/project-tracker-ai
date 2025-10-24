import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pinned } = await req.json();
    const { id: projectId } = await params;

    // Update project pinned status
    await db
      .update(projects)
      .set({ 
        pinned: !!pinned,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId));

    return NextResponse.json({ 
      ok: true, 
      id: projectId, 
      pinned: !!pinned 
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    );
  }
}

