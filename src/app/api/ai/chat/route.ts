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

interface ChatContext {
  mode?: 'analytics' | 'project' | 'general';
  projectId?: string;
  projectName?: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const chatContext: ChatContext = context || { mode: 'general' };

    console.error('[AI Unified Chat] Processing request:', {
      userId,
      mode: chatContext.mode,
      projectId: chatContext.projectId,
    });

    // Build system prompt based on context
    let systemPrompt = '';
    let contextData: any = {};

    if (chatContext.mode === 'analytics') {
      // Analytics context
      const analyticsData = await gatherAnalyticsContext(userId);
      contextData = analyticsData;
      systemPrompt = buildAnalyticsSystemPrompt(analyticsData);
    } else if (chatContext.mode === 'project' && chatContext.projectId) {
      // Project context
      const projectData = await gatherProjectContext(
        userId,
        chatContext.projectId
      );
      contextData = projectData;
      systemPrompt = buildProjectSystemPrompt(projectData);
    } else {
      // General context
      const generalData = await gatherGeneralContext(userId);
      contextData = generalData;
      systemPrompt = buildGeneralSystemPrompt(generalData);
    }

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    console.error('[AI Unified Chat] Request completed successfully');
    return NextResponse.json({
      message: response,
      context: contextData,
    });
  } catch (error: any) {
    console.error('[AI Unified Chat] Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: error.message || 'Failed to process request',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

async function gatherAnalyticsContext(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Completion stats
    const [completionStats] = await db
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

    // Patterns
    const patterns = await patternAnalyzer.getStoredPatterns(userId);

    // Workload analysis
    const workloadAnalysis = await predictiveEngine.analyzeWorkload(userId);

    // Weekly forecast
    const weeklyForecast = await predictiveEngine.getWeeklyForecast(userId);

    // Task counts
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString();

    const [taskCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} IN ('in_progress', 'in-progress'))`,
        notStarted: sql<number>`count(*) filter (where ${tasks.status} IN ('not_started', 'not-completed'))`,
        blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`,
        overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
        dueToday: sql<number>`count(*) filter (where ${tasks.dueDate} = ${todayStr} and ${tasks.status} != 'completed')`,
        completedThisWeek: sql<number>`count(*) filter (where ${tasks.status} = 'completed' AND ${tasks.updatedAt} >= ${startOfWeekStr})`,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.archived, false)));

    // Project count
    const [projectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId));

    return {
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
        completedThisWeek: Number(taskCounts.completedThisWeek),
      },
      projectCount: Number(projectCount.count),
    };
  } catch (error) {
    console.error('[Analytics Context] Error:', error);
    throw error;
  }
}

async function gatherProjectContext(userId: string, projectId: string) {
  try {
    // Fetch project details
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        type: projects.type,
      })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch project tasks
    const projectTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priorityScore,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .limit(50);

    // Calculate stats
    const taskStats = {
      total: projectTasks.length,
      completed: projectTasks.filter((t) => t.status === 'completed').length,
      inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
      blocked: projectTasks.filter((t) => t.status === 'blocked').length,
      notStarted: projectTasks.filter((t) => t.status === 'not_started').length,
    };

    const now = new Date();
    const overdue = projectTasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
      },
      taskStats,
      overdue,
      recentTasks: projectTasks.slice(0, 10),
    };
  } catch (error) {
    console.error('[Project Context] Error:', error);
    throw error;
  }
}

async function gatherGeneralContext(userId: string) {
  try {
    // Get high-level task counts
    const [taskCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} IN ('in_progress', 'in-progress'))`,
        blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`,
        overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.archived, false)));

    // Get project list
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        type: projects.type,
      })
      .from(projects)
      .where(eq(projects.userId, userId))
      .limit(20);

    return {
      taskCounts: {
        total: Number(taskCounts.total),
        completed: Number(taskCounts.completed),
        inProgress: Number(taskCounts.inProgress),
        blocked: Number(taskCounts.blocked),
        overdue: Number(taskCounts.overdue),
      },
      projects: userProjects,
    };
  } catch (error) {
    console.error('[General Context] Error:', error);
    throw error;
  }
}

function buildAnalyticsSystemPrompt(data: any): string {
  return `You are an AI analytics assistant helping users understand their productivity data. You have access to the following analytics:

COMPLETION STATS (last 30 days):
- Total completed tasks: ${data.completionStats.totalCompleted}
- Average task duration: ${data.completionStats.avgDuration} minutes

${
  data.patterns
    ? `PRODUCTIVITY PATTERNS:
- Velocity: ${data.patterns.velocity} tasks/day
- Trend: ${data.patterns.trend}
- Most productive hours: ${data.patterns.productiveHours}`
    : 'PRODUCTIVITY PATTERNS: Not enough data yet'
}

CURRENT WORKLOAD:
- Total active tasks: ${data.workload.totalTasks}
- Estimated hours: ${data.workload.estimatedHours}
- Days to complete: ${data.workload.daysToComplete}
- Urgent: ${data.workload.breakdown.urgent}
- High priority: ${data.workload.breakdown.highPriority}
- Medium priority: ${data.workload.breakdown.mediumPriority}
- Low priority: ${data.workload.breakdown.lowPriority}

TASK STATUS:
- Total tasks: ${data.taskCounts.total}
- Completed: ${data.taskCounts.completed}
- In progress: ${data.taskCounts.inProgress}
- Not started: ${data.taskCounts.notStarted}
- Blocked: ${data.taskCounts.blocked}
- Overdue: ${data.taskCounts.overdue}
- Due today: ${data.taskCounts.dueToday}
- Completed this week: ${data.taskCounts.completedThisWeek}

WEEKLY FORECAST:
- Estimated completions: ${data.forecast.estimatedCompletions}
- At-risk tasks: ${data.forecast.atRiskTasks}
- Capacity utilization: ${data.forecast.capacityUtilization}%

PROJECTS: ${data.projectCount} total

Provide helpful, actionable insights based on this data. Be conversational but precise. Use specific numbers from the data.`;
}

function buildProjectSystemPrompt(data: any): string {
  return `You are an AI project management assistant helping with the project "${data.project.name}".

Project Type: ${data.project.type}
Description: ${data.project.description || 'No description provided'}

Current Project Status:
- Total Tasks: ${data.taskStats.total}
- Completed: ${data.taskStats.completed} (${data.taskStats.total > 0 ? ((data.taskStats.completed / data.taskStats.total) * 100).toFixed(1) : 0}%)
- In Progress: ${data.taskStats.inProgress}
- Blocked: ${data.taskStats.blocked}
- Not Started: ${data.taskStats.notStarted}
- Overdue: ${data.overdue}

Recent Tasks:
${data.recentTasks
  .map(
    (t: any) =>
      `- [${t.status}] ${t.title} (Priority: ${t.priority}, Due: ${t.dueDate || 'No due date'})`
  )
  .join('\n')}

Your role is to:
1. Analyze the project health and provide insights
2. Suggest next tasks or improvements
3. Help identify and resolve blockers
4. Generate status updates
5. Answer questions about the project

Be concise, actionable, and helpful. Use data from the project context above.`;
}

function buildGeneralSystemPrompt(data: any): string {
  return `You are an AI productivity assistant with access to the user's complete task management system.

CURRENT STATUS:
- Total tasks: ${data.taskCounts.total}
- Completed: ${data.taskCounts.completed}
- In progress: ${data.taskCounts.inProgress}
- Blocked: ${data.taskCounts.blocked}
- Overdue: ${data.taskCounts.overdue}

PROJECTS (${data.projects.length} total):
${data.projects.map((p: any) => `- ${p.name} (${p.type})`).join('\n')}

CAPABILITIES:
- Analyze productivity and provide recommendations
- Help with task and project management
- Provide insights on workload and priorities
- Answer questions about tasks and projects
- Offer strategic advice on time management

Be conversational, actionable, and data-driven. Help the user stay productive and organized.`;
}
