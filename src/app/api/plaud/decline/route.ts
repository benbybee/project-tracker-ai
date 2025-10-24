import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { plaudPending } from '@/server/db/schema';
import { inArray } from 'drizzle-orm';

// POST { ids: string[] }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: 'No IDs provided' }, { status: 400 });
    }

    // Delete from plaud_pending (or mark as discarded if you prefer soft deletes)
    const deleted = await db
      .delete(plaudPending)
      .where(inArray(plaudPending.id, ids))
      .returning();

    return NextResponse.json({ 
      ok: true, 
      deleted: deleted.length 
    });
  } catch (error) {
    console.error('Failed to decline Plaud items:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to decline items' },
      { status: 500 }
    );
  }
}

