/**
 * Slack Slash Commands Handler
 * Endpoint: /api/slack/commands
 * Handles /task commands from Slack
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, projects, slackIntegrations } from '@/server/db/schema';
import { eq, and, or, like, lte, gte } from 'drizzle-orm';
import {
  parseSlashCommand,
  formatTaskAsSlackBlock,
  formatTaskListAsSlackBlocks,
  slackErrorResponse,
  slackSuccessResponse,
} from '@/lib/slack-utils';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    // TODO: Verify Slack request signature in production
    // Use x-slack-request-timestamp and x-slack-signature headers with SLACK_SIGNING_SECRET

    const formData = await req.formData();
    // const command = formData.get('command') as string;
    const text = (formData.get('text') as string) || '';
    // const userId = formData.get('user_id') as string;
    const teamId = formData.get('team_id') as string;

    // Find the Slack integration for this team
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.teamId, teamId))
      .limit(1);

    if (!integration) {
      return NextResponse.json({
        response_type: 'ephemeral',
        blocks: slackErrorResponse(
          'Slack integration not found. Please connect your Slack workspace first.'
        ),
      });
    }

    // Parse command
    const parsed = parseSlashCommand(text);

    // Handle different subcommands
    switch (parsed.action) {
      case 'create':
        return await handleCreate(parsed.args, integration.userId);

      case 'list':
        return await handleList(parsed.args, integration.userId);

      case 'complete':
        return await handleComplete(parsed.args, integration.userId);

      case 'search':
        return await handleSearch(
          parsed.fullText.replace(/^search\s+/, ''),
          integration.userId
        );

      case 'today':
        return await handleToday(integration.userId);

      case 'overdue':
        return await handleOverdue(integration.userId);

      case 'help':
      default:
        return NextResponse.json({
          response_type: 'ephemeral',
          blocks: getHelpBlocks(),
        });
    }
  } catch (error: any) {
    console.error('Slack command error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse(
        error.message || 'An error occurred while processing your command.'
      ),
    });
  }
}

/**
 * Handle /task create [project] [title]
 */
async function handleCreate(args: string[], userId: string) {
  if (args.length < 2) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse(
        'Usage: `/task create [project] [title]`\nExample: `/task create my-project Fix login bug`'
      ),
    });
  }

  const projectIdentifier = args[0];
  const title = args.slice(1).join(' ');

  // Find project
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        or(
          eq(projects.id, projectIdentifier),
          like(projects.name, `%${projectIdentifier}%`)
        )
      )
    )
    .limit(1);

  if (!project) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse(
        `Project "${projectIdentifier}" not found. Use the full project ID or name.`
      ),
    });
  }

  // Create task
  const [task] = await db
    .insert(tasks)
    .values({
      title,
      projectId: project.id,
      userId: userId,
      status: 'not_started',
      priorityScore: '2',
    })
    .returning();

  return NextResponse.json({
    response_type: 'in_channel',
    blocks: [
      ...slackSuccessResponse(`Task created in project "${project.name}"`),
      ...formatTaskAsSlackBlock(task, project),
    ],
  });
}

/**
 * Handle /task list [project]
 */
async function handleList(args: string[], userId: string) {
  const projectIdentifier = args[0];

  if (!projectIdentifier) {
    // List all tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          inArray(tasks.status, ['not_started', 'in_progress'])
        )
      )
      .limit(10);

    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: formatTaskListAsSlackBlocks(userTasks),
    });
  }

  // Find project
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        or(
          eq(projects.id, projectIdentifier),
          like(projects.name, `%${projectIdentifier}%`)
        )
      )
    )
    .limit(1);

  if (!project) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse(`Project "${projectIdentifier}" not found.`),
    });
  }

  // List project tasks
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id))
    .limit(10);

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: formatTaskListAsSlackBlocks(projectTasks),
  });
}

/**
 * Handle /task complete [task-id]
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleComplete(args: string[], _userId: string) {
  if (args.length === 0) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse('Usage: `/task complete [task-id]`'),
    });
  }

  const taskId = args[0];

  // Find task
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse(`Task "${taskId}" not found.`),
    });
  }

  // Update task
  const [updatedTask] = await db
    .update(tasks)
    .set({ status: 'completed' })
    .where(eq(tasks.id, taskId))
    .returning();

  return NextResponse.json({
    response_type: 'in_channel',
    blocks: slackSuccessResponse(
      `Task "${updatedTask?.title}" marked as complete! 🎉`
    ),
  });
}

/**
 * Handle /task search [query]
 */
async function handleSearch(query: string, userId: string) {
  if (!query || query.length < 2) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse(
        'Usage: `/task search [query]`\nQuery must be at least 2 characters.'
      ),
    });
  }

  // Search tasks
  const searchResults = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        or(
          like(tasks.title, `%${query}%`),
          like(tasks.description, `%${query}%`)
        )
      )
    )
    .limit(10);

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: formatTaskListAsSlackBlocks(searchResults),
  });
}

/**
 * Handle /task today
 */
async function handleToday(userId: string) {
  const today = new Date();
  const startOfToday = startOfDay(today).toISOString().split('T')[0];
  const endOfToday = endOfDay(today).toISOString().split('T')[0];

  const todayTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.status, ['not_started', 'in_progress']),
        gte(tasks.dueDate, startOfToday),
        lte(tasks.dueDate, endOfToday)
      )
    )
    .limit(10);

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: formatTaskListAsSlackBlocks(todayTasks),
  });
}

/**
 * Handle /task overdue
 */
async function handleOverdue(userId: string) {
  const now = new Date().toISOString().split('T')[0];

  const overdueTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.status, ['not_started', 'in_progress']),
        lte(tasks.dueDate, now)
      )
    )
    .limit(10);

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: formatTaskListAsSlackBlocks(overdueTasks),
  });
}

/**
 * Get help blocks
 */
function getHelpBlocks() {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📚 Task Commands Help',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Available Commands:*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '• `/task create [project] [title]` - Create a new task\n• `/task list [project]` - List tasks (optionally for a project)\n• `/task complete [task-id]` - Mark a task as complete\n• `/task search [query]` - Search your tasks\n• `/task today` - Show tasks due today\n• `/task overdue` - Show overdue tasks\n• `/task help` - Show this help message',
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '_Example: `/task create my-project Fix the login bug`_',
        },
      ],
    },
  ];
}

// Import missing inArray function
function inArray(column: any, values: any[]) {
  // Use the proper drizzle-orm inArray function
  return or(...values.map((v) => eq(column, v)));
}
