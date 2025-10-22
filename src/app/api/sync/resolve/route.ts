import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, projects } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { entityType, entityId, winner, local, remote } = await req.json();
    
    if (winner === 'local') {
      // Force update server with local data
      if (entityType === 'task') {
        await db.update(tasks)
          .set({
            ...local,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, entityId));
      } else if (entityType === 'project') {
        await db.update(projects)
          .set({
            ...local,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, entityId));
      }
    } else if (winner === 'remote') {
      // Server data is already correct, no action needed
      // Client will receive the remote data on next pull
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Conflict resolution error:', e);
    return NextResponse.json({ error: 'resolve failed' }, { status: 500 });
  }
}
