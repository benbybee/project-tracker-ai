import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, projects } from '@/server/db/schema';
import { gt } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const since = Number(url.searchParams.get('since') || '0');

    // Fetch all tasks and projects updated since the given timestamp
    const [taskChanges, projectChanges] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(gt(tasks.updatedAt, new Date(since))),
      db
        .select()
        .from(projects)
        .where(gt(projects.updatedAt, new Date(since))),
    ]);

    const changes = {
      tasks: taskChanges,
      projects: projectChanges,
    };

    const serverVersion = Date.now();

    return NextResponse.json({ changes, serverVersion });
  } catch (e) {
    console.error('Pull sync error:', e);
    return NextResponse.json({ error: 'pull failed' }, { status: 500 });
  }
}
