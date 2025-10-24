import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { plaudPending } from '@/server/db/schema';

// Plaud → Zapier → this endpoint
// Expect: { items: [{ title, description, confidence?, sourceId?, suggestedProjectName? }] }
export async function POST(req: Request) {
  try {
    // TODO: verify signature if configured (check header for webhook secret)
    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body?.items) ? body.items : [];

    if (incoming.length === 0) {
      return NextResponse.json({ ok: true, received: 0, message: 'No items provided' });
    }

    // Insert incoming items into plaud_pending table
    const inserted = await db.insert(plaudPending).values(
      incoming.map((item: any) => ({
        title: item.title || 'Untitled',
        description: item.description || null,
        confidence: item.confidence ? parseInt(item.confidence) : null,
        sourceId: item.sourceId || null,
        suggestedProjectName: item.suggestedProjectName || null,
      }))
    ).returning();

    return NextResponse.json({ 
      ok: true, 
      received: incoming.length,
      created: inserted.length
    });
  } catch (error) {
    console.error('Plaud webhook error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
