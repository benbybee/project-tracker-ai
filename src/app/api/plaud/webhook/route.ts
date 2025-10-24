import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  // TODO: verify signature, parse payload, extract tasks, store pending items
  return NextResponse.json({ ok: true });
}
