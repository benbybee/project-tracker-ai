import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tickets, ticketAttachments } from '@/server/db/schema';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const customerName = String(form.get('customerName') || '');
    const customerEmail = String(form.get('customerEmail') || '');
    const projectName = String(form.get('projectName') || '');
    const domain = form.get('domain')?.toString() || null;
    const details = String(form.get('details') || '');
    const dueDateSuggested = form.get('dueDateSuggested')?.toString() || null;
    const priority = (form.get('priority')?.toString() || 'normal') as 'low'|'normal'|'high'|'urgent';

    if (!customerName || !customerEmail || !projectName || !details) {
      return NextResponse.json({ error: 'Customer name, email, project name and details are required' }, { status: 400 });
    }

    // Simple ETA heuristic stub: urgent +3 days, else +5 days
    const now = new Date();
    const eta = new Date(now);
    eta.setDate(eta.getDate() + (priority === 'urgent' ? 3 : 5));
    const aiEta = eta.toISOString().slice(0,10);

    // Insert ticket into database
    const [ticket] = await db.insert(tickets).values({
      customerName,
      customerEmail,
      projectName,
      domain,
      details,
      dueDateSuggested,
      priority,
      status: 'new',
      aiEta,
    }).returning();

    // Handle file attachments (stubbed - store file metadata only)
    const files = form.getAll('files') as File[];
    const attachmentPromises = files
      .filter(f => f.size > 0)
      .map(async (file) => {
        return db.insert(ticketAttachments).values({
          ticketId: ticket.id,
          fileName: file.name,
          fileSize: file.size,
          url: null, // TODO: upload to Vercel Blob/S3 and store URL
        });
      });

    await Promise.all(attachmentPromises);

    return NextResponse.json({ 
      ok: true, 
      id: ticket.id, 
      aiEta 
    });
  } catch (error: any) {
    console.error('Failed to create ticket:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

