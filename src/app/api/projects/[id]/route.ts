import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;

    // Extract allowed fields for update
    const updateData: any = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.websiteStatus !== undefined) updateData.websiteStatus = body.websiteStatus;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.stagingUrl !== undefined) updateData.stagingUrl = body.stagingUrl;
    if (body.hostingProvider !== undefined) updateData.hostingProvider = body.hostingProvider;
    if (body.dnsStatus !== undefined) updateData.dnsStatus = body.dnsStatus;
    if (body.goLiveDate !== undefined) updateData.goLiveDate = body.goLiveDate;
    if (body.repoUrl !== undefined) updateData.repoUrl = body.repoUrl;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.pinned !== undefined) updateData.pinned = body.pinned;

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    // When converting from website to general, set websiteStatus to null
    if (body.type === 'general') {
      updateData.websiteStatus = null;
    }

    // When converting to website, set initial status if not provided
    if (body.type === 'website' && !body.websiteStatus) {
      updateData.websiteStatus = 'discovery';
    }

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

