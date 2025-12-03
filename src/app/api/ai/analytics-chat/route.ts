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
    console.error('[AI Analytics Chat] Starting request for user:', userId);

    // Gather analytics context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let completionStats;
    let patterns;
    let workloadAnalysis;
    let weeklyForecast;

    try {
      console.error('[AI Analytics Chat] Fetching completion stats...');
      [completionStats] = await db
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
        );
      console.error(
        '[AI Analytics Chat] Completion stats fetched successfully'
      );
    } catch (error: any) {
      console.error('[AI Analytics Chat] Error fetching completion stats:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch completion stats: ${error.message}`);
    }

    try {
      console.error('[AI Analytics Chat] Fetching user patterns...');
      patterns = await patternAnalyzer.getStoredPatterns(userId);
      console.error('[AI Analytics Chat] User patterns fetched:', {
        found: !!patterns,
      });
    } catch (error: any) {
      console.error('[AI Analytics Chat] Error fetching patterns:', {
        error: error.message,
        stack: error.stack,
      });
      // Continue without patterns
      patterns = null;
    }

    try {
      console.error('[AI Analytics Chat] Analyzing workload...');
      workloadAnalysis = await predictiveEngine.analyzeWorkload(userId);
      console.error('[AI Analytics Chat] Workload analyzed successfully');
    } catch (error: any) {
      console.error('[AI Analytics Chat] Error analyzing workload:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to analyze workload: ${error.message}`);
    }

    try {
      console.error('[AI Analytics Chat] Fetching weekly forecast...');
      weeklyForecast = await predictiveEngine.getWeeklyForecast(userId);
      console.error('[AI Analytics Chat] Weekly forecast fetched successfully');
    } catch (error: any) {
      console.error('[AI Analytics Chat] Error fetching forecast:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch weekly forecast: ${error.message}`);
    }

    // Get active task counts
    let taskCounts;
    try {
      console.error('[AI Analytics Chat] Fetching task counts...');
      const todayStr = new Date().toISOString().split('T')[0];

      // Calculate start of week (Sunday)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekStr = startOfWeek.toISOString();

      // Calculate start of month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString();

      [taskCounts] = await db
        .select({
          total: sql<number>`count(*)`,
          completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
          inProgress: sql<number>`count(*) filter (where ${tasks.status} IN ('in_progress', 'in-progress'))`,
          notStarted: sql<number>`count(*) filter (where ${tasks.status} IN ('not_started', 'not-completed'))`,
          blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`,
          overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
          dueToday: sql<number>`count(*) filter (where ${tasks.dueDate} = ${todayStr} and ${tasks.status} != 'completed')`,
          createdThisWeek: sql<number>`count(*) filter (where ${tasks.createdAt} >= ${startOfWeekStr})`,
          createdThisMonth: sql<number>`count(*) filter (where ${tasks.createdAt} >= ${startOfMonthStr})`,
          completedThisWeek: sql<number>`count(*) filter (where ${tasks.status} = 'completed' AND ${tasks.updatedAt} >= ${startOfWeekStr})`,
          completedThisMonth: sql<number>`count(*) filter (where ${tasks.status} = 'completed' AND ${tasks.updatedAt} >= ${startOfMonthStr})`,
        })
        .from(tasks)
        .where(and(eq(tasks.userId, userId), eq(tasks.archived, false)));
      console.error('[AI Analytics Chat] Task counts fetched successfully');
    } catch (error: any) {
      console.error('[AI Analytics Chat] Error fetching task counts:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch task counts: ${error.message}`);
    }

    // Get project counts
    let projectCount;
    try {
      console.error('[AI Analytics Chat] Fetching project counts...');
      [projectCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(eq(projects.userId, userId));
      console.error('[AI Analytics Chat] Project counts fetched successfully');
    } catch (error: any) {
      console.error('[AI Analytics Chat] Error fetching project counts:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch project counts: ${error.message}`);
    }

    // Build context for AI
    const analyticsContext = {
      completionStats: {
        totalCompleted: Number(completionStats?.count || 0),
        avgDuration: Math.round(Number(completionStats?.avgDuration || 0)),
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
        blocked: Number(taskCounts.blocked),
        overdue: Number(taskCounts.overdue),
        dueToday: Number(taskCounts.dueToday),
        createdThisWeek: Number(taskCounts.createdThisWeek),
        createdThisMonth: Number(taskCounts.createdThisMonth),
        completedThisWeek: Number(taskCounts.completedThisWeek),
        completedThisMonth: Number(taskCounts.completedThisMonth),
      },
      projectCount: Number(projectCount.count),
    };

    // Create prompt for OpenAI
    const systemPrompt = `You are an AI analytics assistant helping users accomplish their goals and understand their productivity data. You have access to the following analytics:

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
- Blocked: ${analyticsContext.taskCounts.blocked}
- Overdue: ${analyticsContext.taskCounts.overdue}
- Due today: ${analyticsContext.taskCounts.dueToday}

RECENT ACTIVITY:
- Tasks created this week: ${analyticsContext.taskCounts.createdThisWeek}
- Tasks created this month: ${analyticsContext.taskCounts.createdThisMonth}
- Tasks completed this week: ${analyticsContext.taskCounts.completedThisWeek}
- Tasks completed this month: ${analyticsContext.taskCounts.completedThisMonth}

WEEKLY FORECAST:
- Estimated completions: ${analyticsContext.forecast.estimatedCompletions}
- At-risk tasks: ${analyticsContext.forecast.atRiskTasks}
- Capacity utilization: ${analyticsContext.forecast.capacityUtilization}%

PROJECTS: ${analyticsContext.projectCount} total

IMPORTANT INSTRUCTIONS:
1. When the user states a clear goal or request (e.g., "I need to add a new project"), PRIORITIZE helping them accomplish it. Be supportive and action-oriented.
2. Provide helpful insights, recommendations, and raise concerns as SUPPLEMENTARY information, not as blockers or discouragement.
3. Frame concerns as "Note:" or "FYI:" rather than warnings that push back against the user's stated goal.
4. Lead with the answer or help for their request, then follow with relevant context if applicable.
5. Only push back on truly problematic requests (e.g., deleting all data), otherwise always support the user's goals.
6. Be conversational, precise, and use specific numbers from the data when relevant.
7. If asked about trends or analysis, provide thorough insights using the available data.`;

    // Call OpenAI
    let completion;
    try {
      console.error('[AI Analytics Chat] Initializing OpenAI client...');
      const openai = getOpenAIClient();

      console.error('[AI Analytics Chat] Calling OpenAI API...');
      completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      console.error('[AI Analytics Chat] OpenAI API call successful');
    } catch (error: any) {
      console.error('[AI Analytics Chat] OpenAI API error:', {
        error: error.message,
        code: error.code,
        type: error.type,
        status: error.status,
        stack: error.stack,
      });
      throw new Error(
        `OpenAI API failed: ${error.message} (${error.type || 'unknown error'})`
      );
    }

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      console.error('[AI Analytics Chat] Empty response from OpenAI');
      throw new Error('No response from AI');
    }

    console.error('[AI Analytics Chat] Request completed successfully');
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('[AI Analytics Chat] Fatal error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: error.message || 'Failed to process query',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
