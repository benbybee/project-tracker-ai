import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, projects } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';

/**
 * Test endpoint for due date database round trip
 *
 * This endpoint:
 * 1. Creates a test task with a specific dueDate
 * 2. Immediately reads it back from the database
 * 3. Deletes the test task
 * 4. Returns comparison of sent vs retrieved values
 *
 * Purpose: Verify that YYYY-MM-DD date strings are stored and retrieved correctly
 */
export async function POST(req: Request) {
  try {
    // Get session to get user ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dueDate } = await req.json();

    console.log('🧪 TEST: Received dueDate:', dueDate);
    console.log('🧪 TEST: Type:', typeof dueDate);

    // Get first project for this user (or create test project)
    let [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .limit(1);

    if (!project) {
      [project] = await db
        .insert(projects)
        .values({
          userId: session.user.id,
          name: '__TEST_PROJECT__',
          type: 'general',
        })
        .returning();
    }

    // Insert task with date
    const [inserted] = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        projectId: project.id,
        title: '__TEST_TASK_DUE_DATE__',
        description: 'Temporary test task for due date validation',
        status: 'not_started',
        dueDate: dueDate,
      })
      .returning();

    console.log('🧪 TEST: Inserted task:', {
      id: inserted.id,
      dueDate: inserted.dueDate,
      type: typeof inserted.dueDate,
    });

    // Immediately read it back
    const [retrieved] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, inserted.id), eq(tasks.userId, session.user.id)));

    console.log('🧪 TEST: Retrieved task:', {
      id: retrieved.id,
      dueDate: retrieved.dueDate,
      type: typeof retrieved.dueDate,
    });

    // Convert Date objects to YYYY-MM-DD strings if necessary
    const insertedDateStr = inserted.dueDate
      ? typeof inserted.dueDate === 'string'
        ? inserted.dueDate
        : inserted.dueDate.toISOString().split('T')[0]
      : null;

    const retrievedDateStr = retrieved.dueDate
      ? typeof retrieved.dueDate === 'string'
        ? retrieved.dueDate
        : retrieved.dueDate.toISOString().split('T')[0]
      : null;

    // Clean up - delete test task
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, inserted.id), eq(tasks.userId, session.user.id)));

    console.log('🧪 TEST: Test task deleted');

    // Compare values
    const match = dueDate === retrievedDateStr;

    const result = {
      success: true,
      sent: dueDate,
      sentType: typeof dueDate,
      insertedValue: insertedDateStr,
      insertedType: typeof insertedDateStr,
      insertedRaw: inserted.dueDate,
      retrievedValue: retrievedDateStr,
      retrievedType: typeof retrievedDateStr,
      retrievedRaw: retrieved.dueDate,
      match: match,
      message: match
        ? '✅ Date round-trip successful!'
        : '❌ Date mismatch detected!',
    };

    console.log('🧪 TEST: Result:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('🧪 TEST ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}