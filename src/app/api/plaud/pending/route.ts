import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { plaudPending } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await db
      .select()
      .from(plaudPending)
      .orderBy(desc(plaudPending.createdAt));

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        title: item.title,
        description: item.description,
        confidence: item.confidence,
        sourceId: item.sourceId,
        suggestedProjectName: item.suggestedProjectName,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch pending items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending items', items: [] },
      { status: 500 }
    );
  }
}
