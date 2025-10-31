import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

interface DiagnosticResult {
  service: string;
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: any;
}

export async function GET() {
  const results: DiagnosticResult[] = [];
  let overallStatus: 'ok' | 'error' | 'warning' = 'ok';

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // 1. Check OpenAI API Key
    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        results.push({
          service: 'OpenAI API Key',
          status: 'error',
          message: 'OPENAI_API_KEY environment variable is not set',
        });
        overallStatus = 'error';
      } else if (apiKey === 'sk-dummy-key') {
        results.push({
          service: 'OpenAI API Key',
          status: 'warning',
          message: 'OPENAI_API_KEY is set to dummy value',
        });
        if (overallStatus === 'ok') overallStatus = 'warning';
      } else if (!apiKey.startsWith('sk-')) {
        results.push({
          service: 'OpenAI API Key',
          status: 'error',
          message: 'OPENAI_API_KEY format is invalid (should start with sk-)',
          details: { prefix: apiKey.substring(0, 3) },
        });
        overallStatus = 'error';
      } else {
        results.push({
          service: 'OpenAI API Key',
          status: 'ok',
          message: 'API key is configured',
          details: {
            prefix: apiKey.substring(0, 7),
            length: apiKey.length,
          },
        });
      }
    } catch (error: any) {
      results.push({
        service: 'OpenAI API Key',
        status: 'error',
        message: 'Error checking API key',
        details: { error: error.message },
      });
      overallStatus = 'error';
    }

    // 2. Test OpenAI API Connection
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey && apiKey !== 'sk-dummy-key' && apiKey.startsWith('sk-')) {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
          max_tokens: 10,
        });

        if (response.choices[0]?.message?.content) {
          results.push({
            service: 'OpenAI API',
            status: 'ok',
            message: 'Successfully connected to OpenAI API',
            details: {
              model: response.model,
              response: response.choices[0].message.content,
            },
          });
        } else {
          results.push({
            service: 'OpenAI API',
            status: 'error',
            message: 'OpenAI API returned empty response',
          });
          overallStatus = 'error';
        }
      } else {
        results.push({
          service: 'OpenAI API',
          status: 'warning',
          message: 'Skipped API test due to invalid/missing key',
        });
        if (overallStatus === 'ok') overallStatus = 'warning';
      }
    } catch (error: any) {
      results.push({
        service: 'OpenAI API',
        status: 'error',
        message: 'Failed to connect to OpenAI API',
        details: {
          error: error.message,
          code: error.code,
          type: error.type,
          status: error.status,
        },
      });
      overallStatus = 'error';
    }

    // 3. Test Database Connection
    try {
      const result = await db.execute(sql`SELECT 1 as test`);
      results.push({
        service: 'Database',
        status: 'ok',
        message: 'Database connection successful',
      });
    } catch (error: any) {
      results.push({
        service: 'Database',
        status: 'error',
        message: 'Database connection failed',
        details: {
          error: error.message,
          code: error.code,
        },
      });
      overallStatus = 'error';
    }

    // 4. Test Pattern Analyzer
    try {
      const { patternAnalyzer } = await import('@/lib/ai/pattern-analyzer');
      const patterns = await patternAnalyzer.getStoredPatterns(session.user.id);

      results.push({
        service: 'Pattern Analyzer',
        status: 'ok',
        message: 'Pattern analyzer accessible',
        details: {
          patternsFound: patterns ? 'yes' : 'no',
          hasVelocity: patterns?.velocity ? 'yes' : 'no',
        },
      });
    } catch (error: any) {
      results.push({
        service: 'Pattern Analyzer',
        status: 'error',
        message: 'Pattern analyzer failed',
        details: {
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 3),
        },
      });
      overallStatus = 'error';
    }

    // 5. Test Predictive Engine
    try {
      const { predictiveEngine } = await import('@/lib/ai/predictive-engine');
      const workload = await predictiveEngine.analyzeWorkload(session.user.id);

      results.push({
        service: 'Predictive Engine',
        status: 'ok',
        message: 'Predictive engine accessible',
        details: {
          totalTasks: workload.totalTasks,
          estimatedHours: workload.totalEstimatedHours,
        },
      });
    } catch (error: any) {
      results.push({
        service: 'Predictive Engine',
        status: 'error',
        message: 'Predictive engine failed',
        details: {
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 3),
        },
      });
      overallStatus = 'error';
    }

    // 6. Check Environment Variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'missing',
    };

    results.push({
      service: 'Environment Variables',
      status: 'ok',
      message: 'Environment variable check',
      details: envVars,
    });

    return NextResponse.json({
      overallStatus,
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      results,
    });
  } catch (error: any) {
    console.error('[AI Diagnostics] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Diagnostic check failed',
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5),
      },
      { status: 500 }
    );
  }
}

