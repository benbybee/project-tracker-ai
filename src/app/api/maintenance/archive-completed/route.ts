import { NextResponse } from 'next/server';
// Move tasks status=completed finished this week -> archive table; delete > 6 months
export async function GET() {
  // TODO: implement DB move & retention (26 weeks)
  return NextResponse.json({ ok: true });
}
