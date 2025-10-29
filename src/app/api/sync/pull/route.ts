import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, projects } from '@/server/db/schema';
import { gt, and, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { logSyncActivity } from '@/lib/activity-logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const since = Number(url.searchParams.get('since') || '0');

    // Fetch tasks and projects for this user updated since the given timestamp
    const [taskChanges, projectChanges] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(
          and(
            gt(tasks.updatedAt, new Date(since)),
            eq(tasks.userId, session.user.id)
          )
        ),
      db
        .select()
        .from(projects)
        .where(
          and(
            gt(projects.updatedAt, new Date(since)),
            eq(projects.userId, session.user.id)
          )
        ),
    ]);

    const changes = {
      tasks: taskChanges,
      projects: projectChanges,
    };

    const serverVersion = Date.now();

    // Log sync activity
    if (taskChanges.length > 0 || projectChanges.length > 0) {
      await logSyncActivity({
        userId: session.user.id,
        tasksCount: taskChanges.length,
        projectsCount: projectChanges.length,
        conflictsCount: 0,
        payload: {
          direction: 'pull',
          since,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ changes, serverVersion });
  } catch (e) {
    console.error('Pull sync error:', e);
    return NextResponse.json({ error: 'pull failed' }, { status: 500 });
  }
}
