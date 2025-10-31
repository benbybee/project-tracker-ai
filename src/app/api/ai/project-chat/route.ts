import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import OpenAI from 'openai';
import { db, projects, tasks } from '@/server/db';
import { eq, and } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, message, history } = await req.json();

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch project details
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        type: projects.type,
      })
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
      )
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch project tasks for context
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

    // Count task statuses
    const taskStats = {
      total: projectTasks.length,
      completed: projectTasks.filter((t) => t.status === 'completed').length,
      inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
      blocked: projectTasks.filter((t) => t.status === 'blocked').length,
      notStarted: projectTasks.filter((t) => t.status === 'not_started').length,
    };

    // Count overdue
    const now = new Date();
    const overdue = projectTasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Build context for AI
    const systemPrompt = `You are an AI project management assistant helping with the project "${project.name}".

Project Type: ${project.type}
Description: ${project.description || 'No description provided'}

Current Project Status:
- Total Tasks: ${taskStats.total}
- Completed: ${taskStats.completed} (${taskStats.total > 0 ? ((taskStats.completed / taskStats.total) * 100).toFixed(1) : 0}%)
- In Progress: ${taskStats.inProgress}
- Blocked: ${taskStats.blocked}
- Not Started: ${taskStats.notStarted}
- Overdue: ${overdue}

Recent Tasks:
${projectTasks
  .slice(0, 10)
  .map(
    (t) =>
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

    // Prepare conversation history
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add history if provided
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        // Last 10 messages
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiMessage = completion.choices[0]?.message?.content || 'No response';

    return NextResponse.json({
      message: aiMessage,
      projectContext: {
        name: project.name,
        stats: taskStats,
        overdue,
      },
    });
  } catch (error: any) {
    console.error('[project-chat] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
