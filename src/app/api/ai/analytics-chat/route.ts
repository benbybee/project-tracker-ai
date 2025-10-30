import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { taskAnalytics, tasks, projects } from '@/server/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { patternAnalyzer } from '@/lib/ai/pattern-analyzer';
import { predictiveEngine } from '@/lib/ai/predictive-engine';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Gather analytics context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [completionStats, patterns, workloadAnalysis, weeklyForecast] =
      await Promise.all([
        // Get completion statistics
        db
          .select({
            count: sql<number>`count(*)`,
            avgDuration: sql<number>`avg(${taskAnalytics.actualDurationMinutes})`,
          })
          .from(taskAnalytics)
          .where(
            and(
              eq(taskAnalytics.userId, userId),
              gte(taskAnalytics.createdAt, thirtyDaysAgo)
            )
          ),

        // Get user patterns
        patternAnalyzer.getStoredPatterns(userId),

        // Get workload analysis
        predictiveEngine.analyzeWorkload(userId),

        // Get weekly forecast
        predictiveEngine.getWeeklyForecast(userId),
      ]);

    // Get active task counts
    const [taskCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} = 'in_progress')`,
        notStarted: sql<number>`count(*) filter (where ${tasks.status} = 'not_started')`,
        overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.archived, false)));

    // Get project counts
    const [projectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId));

    // Build context for AI
    const analyticsContext = {
      completionStats: {
        totalCompleted: Number(completionStats[0]?.count || 0),
        avgDuration: Math.round(Number(completionStats[0]?.avgDuration || 0)),
      },
      patterns: patterns
        ? {
            velocity: patterns.velocity.tasksPerDay.toFixed(1),
            trend: patterns.velocity.trend,
            productiveHours: patterns.productiveHours.join(', '),
          }
        : null,
      workload: {
        totalTasks: workloadAnalysis.totalTasks,
        estimatedHours: workloadAnalysis.totalEstimatedHours,
        daysToComplete: workloadAnalysis.daysToComplete,
        breakdown: workloadAnalysis.taskBreakdown,
      },
      forecast: {
        estimatedCompletions: weeklyForecast.estimatedCompletions,
        atRiskTasks: weeklyForecast.atRiskTasks,
        capacityUtilization: weeklyForecast.capacityUtilization,
      },
      taskCounts: {
        total: Number(taskCounts.total),
        completed: Number(taskCounts.completed),
        inProgress: Number(taskCounts.inProgress),
        notStarted: Number(taskCounts.notStarted),
        overdue: Number(taskCounts.overdue),
      },
      projectCount: Number(projectCount.count),
    };

    // Create prompt for OpenAI
    const systemPrompt = `You are an AI analytics assistant helping users understand their productivity data. You have access to the following analytics:

COMPLETION STATS (last 30 days):
- Total completed tasks: ${analyticsContext.completionStats.totalCompleted}
- Average task duration: ${analyticsContext.completionStats.avgDuration} minutes

${
  analyticsContext.patterns
    ? `PRODUCTIVITY PATTERNS:
- Velocity: ${analyticsContext.patterns.velocity} tasks/day
- Trend: ${analyticsContext.patterns.trend}
- Most productive hours: ${analyticsContext.patterns.productiveHours}`
    : 'PRODUCTIVITY PATTERNS: Not enough data yet'
}

CURRENT WORKLOAD:
- Total active tasks: ${analyticsContext.workload.totalTasks}
- Estimated hours: ${analyticsContext.workload.estimatedHours}
- Days to complete: ${analyticsContext.workload.daysToComplete}
- Urgent: ${analyticsContext.workload.breakdown.urgent}
- High priority: ${analyticsContext.workload.breakdown.highPriority}
- Medium priority: ${analyticsContext.workload.breakdown.mediumPriority}
- Low priority: ${analyticsContext.workload.breakdown.lowPriority}

TASK STATUS:
- Total tasks: ${analyticsContext.taskCounts.total}
- Completed: ${analyticsContext.taskCounts.completed}
- In progress: ${analyticsContext.taskCounts.inProgress}
- Not started: ${analyticsContext.taskCounts.notStarted}
- Overdue: ${analyticsContext.taskCounts.overdue}

WEEKLY FORECAST:
- Estimated completions: ${analyticsContext.forecast.estimatedCompletions}
- At-risk tasks: ${analyticsContext.forecast.atRiskTasks}
- Capacity utilization: ${analyticsContext.forecast.capacityUtilization}%

PROJECTS: ${analyticsContext.projectCount} total

Provide helpful, actionable insights based on this data. Be conversational but precise. Use specific numbers from the data. If asked about trends, mention the velocity trend. If asked about productivity, highlight the productive hours pattern.`;

    // Call OpenAI
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('[AI Analytics Chat] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process query' },
      { status: 500 }
    );
  }
}
