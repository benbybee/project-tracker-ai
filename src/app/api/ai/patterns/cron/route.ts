import { NextResponse } from 'next/server';
import { patternAnalyzer } from '@/lib/ai/pattern-analyzer';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { logger } from '@/lib/logger';

/**
 * Weekly Pattern Update Cron Job
 *
 * This endpoint should be called weekly (e.g., via Vercel Cron or external scheduler)
 * to update all users' productivity patterns based on their recent task completion data.
 *
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/ai/patterns/cron",
 *     "schedule": "0 0 * * 0"
 *   }]
 * }
 *
 * Or call manually: POST /api/ai/patterns/cron
 */

export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting weekly pattern update job');

    // Get all users
    const allUsers = await db.select({ id: users.id }).from(users);

    logger.info(`Found ${allUsers.length} users to process`);

    const results = {
      total: allUsers.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    // Process each user
    for (const user of allUsers) {
      try {
        logger.info(`Analyzing patterns for user: ${user.id}`);
        await patternAnalyzer.analyzeUserPatterns(user.id);
        results.successful++;
      } catch (error: any) {
        logger.error(`Failed to analyze patterns for user ${user.id}`, error, {
          userId: user.id,
        });
        results.failed++;
        results.errors.push({
          userId: user.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    logger.info('Pattern update job completed', results);

    return NextResponse.json({
      success: true,
      message: 'Pattern update job completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Pattern Cron] Job failed:', error);
    return NextResponse.json(
      {
        error: error.message || 'Pattern update job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual triggers and status checks
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'ready',
      message: 'Pattern update cron job is configured and ready',
      schedule: 'Weekly (Sunday at midnight)',
      endpoint: '/api/ai/patterns/cron',
      method: 'POST',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}
