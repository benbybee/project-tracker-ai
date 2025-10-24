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

    const { ids, days } = await req.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }
    
    if (typeof days !== 'number' || days < 1) {
      return NextResponse.json({ error: 'Invalid days' }, { status: 400 });
    }

    // Get existing tasks to calculate new due dates
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.id, ids));

    // Update each task's due date
    for (const task of existingTasks) {
      const currentDue = task.dueDate ? new Date(task.dueDate) : new Date();
      const newDue = new Date(currentDue.getTime() + days * 86400000);
      const newDueStr = newDue.toISOString().split('T')[0];

      await db
        .update(tasks)
        .set({ 
          dueDate: newDueStr,
          updatedAt: new Date()
        })
        .where(inArray(tasks.id, [task.id]))
        .returning();
    }

    return NextResponse.json({ ok: true, ids, days });
  } catch (error) {
    console.error('Bulk defer error:', error);
    return NextResponse.json(
      { error: 'Failed to defer tasks' },
      { status: 500 }
    );
  }
}

