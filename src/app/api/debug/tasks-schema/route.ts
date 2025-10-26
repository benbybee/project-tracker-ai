import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks } from '@/server/db/schema';

export async function GET() {
  try {
    // Try to select from tasks table to see if it exists and what columns it has
    const result = await db.select().from(tasks).limit(1);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tasks table accessible',
      sampleTask: result[0] || 'No tasks found'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}
