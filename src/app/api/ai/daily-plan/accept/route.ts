import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { suggestions } = await req.json();
  // TODO: create tasks in DB and Dexie, enqueue ops
  return NextResponse.json({ ok: true });
}
