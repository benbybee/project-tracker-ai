import { NextResponse } from 'next/server';
export async function POST() {
  // TODO: call your model with context; return a curated list only on demand
  return NextResponse.json({ suggestions: [] }); // keep empty until wired
}
