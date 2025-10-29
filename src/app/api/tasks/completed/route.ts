import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tasks, projects, roles } from '@/server/db/schema';
import { eq, and, gte, desc, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const roleId = searchParams.get('roleId');
    const dateRange = searchParams.get('dateRange') || '30'; // days
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const offset = (page - 1) * limit;

    // Calculate date filter
    const now = new Date();
    const daysAgo = parseInt(dateRange);
    const startDate = new Date(now.getTime() - daysAgo * 86400000);

    // Build conditions - completed OR archived
    const conditions = [gte(tasks.updatedAt, startDate)];

    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    if (roleId) {
      conditions.push(eq(tasks.roleId, roleId));
    }

    // Fetch completed/archived tasks
    const completedTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        dueDate: tasks.dueDate,
        archived: tasks.archived,
        archivedAt: tasks.archivedAt,
        updatedAt: tasks.updatedAt,
        createdAt: tasks.createdAt,
        projectId: tasks.projectId,
        roleId: tasks.roleId,
        projectName: projects.name,
        projectIdRef: projects.id,
        roleName: roles.name,
        roleColor: roles.color,
        roleIdRef: roles.id,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(roles, eq(tasks.roleId, roles.id))
      .where(
        and(
          or(eq(tasks.status, 'completed'), eq(tasks.archived, true)),
          ...conditions
        )
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: tasks.id })
      .from(tasks)
      .where(
        and(
          or(eq(tasks.status, 'completed'), eq(tasks.archived, true)),
          ...conditions
        )
      );

    // Transform the result to match the expected structure
    const transformedTasks = completedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      dueDate: t.dueDate,
      archived: t.archived,
      archivedAt: t.archivedAt,
      updatedAt: t.updatedAt,
      createdAt: t.createdAt,
      projectId: t.projectId,
      roleId: t.roleId,
      project:
        t.projectIdRef && t.projectName
          ? { id: t.projectIdRef, name: t.projectName }
          : null,
      role:
        t.roleIdRef && t.roleName
          ? { id: t.roleIdRef, name: t.roleName, color: t.roleColor || '#gray' }
          : null,
    }));

    return NextResponse.json({
      tasks: transformedTasks,
      total: totalResult.length,
      page,
      limit,
      hasMore: completedTasks.length === limit,
    });
  } catch (error) {
    console.error('Failed to fetch completed tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completed tasks' },
      { status: 500 }
    );
  }
}
