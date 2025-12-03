import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }

    // Mark all tasks as part of daily plan
    await db
      .update(tasks)
      .set({
        isDaily: true,
        updatedAt: new Date(),
      })
      .where(inArray(tasks.id, ids));

    return NextResponse.json({ ok: true, ids });
  } catch (error) {
    console.error('Bulk set daily plan error:', error);
    return NextResponse.json(
      { error: 'Failed to set daily plan' },
      { status: 500 }
    );
  }
}
