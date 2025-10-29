import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { patternAnalyzer } from '@/lib/ai/pattern-analyzer';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Analyzing patterns for user', { userId: session.user.id });

    // Run pattern analysis
    const patterns = await patternAnalyzer.analyzeUserPatterns(session.user.id);

    return NextResponse.json({
      success: true,
      patterns,
      message: 'Patterns updated successfully',
    });
  } catch (error: any) {
    console.error('[Pattern Update] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update patterns' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current patterns
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patterns = await patternAnalyzer.getStoredPatterns(session.user.id);

    if (!patterns) {
      return NextResponse.json({
        success: false,
        message:
          'No patterns found. Complete more tasks to enable AI learning.',
      });
    }

    return NextResponse.json({
      success: true,
      patterns,
    });
  } catch (error: any) {
    console.error('[Pattern Get] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve patterns' },
      { status: 500 }
    );
  }
}
