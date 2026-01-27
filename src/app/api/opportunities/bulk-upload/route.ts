import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { opportunities } from '@/server/db/schema';
import { parseOpportunitiesFromMarkdown } from '@/lib/parse-opportunities-md';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sprintId = formData.get('sprintId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Only .md files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse opportunities from markdown
    const parsedOpportunities = parseOpportunitiesFromMarkdown(content);

    if (parsedOpportunities.length === 0) {
      return NextResponse.json(
        { error: 'No valid opportunities found in the file' },
        { status: 400 }
      );
    }

    // Create opportunities in bulk
    const createdOpportunities = await db
      .insert(opportunities)
      .values(
        parsedOpportunities.map((opp) => ({
          userId: session.user.id,
          name: opp.name,
          type: opp.type,
          lane: opp.lane,
          summary: opp.summary,
          complexity: opp.complexity,
          estimatedCost: opp.estimatedCost,
          goToMarket: opp.goToMarket,
          details: opp.details,
          status: opp.status || 'IDEA',
          priority: opp.priority || 3,
          notes: opp.notes,
          sprintId: sprintId || undefined,
        }))
      )
      .returning();

    return NextResponse.json({
      success: true,
      count: createdOpportunities.length,
      opportunities: createdOpportunities,
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload opportunities' },
      { status: 500 }
    );
  }
}

