/**
 * Slack Integration Utilities
 * Helper functions for formatting and handling Slack messages
 */

import type { Task, Project } from '@/server/db/schema';
import { format } from 'date-fns';

// Slack message block types
export interface SlackBlock {
  type: string;
  [key: string]: any;
}

// Priority emoji mapping (priorityScore: 1=low, 2=medium, 3=high, 4=urgent)
const PRIORITY_EMOJI: Record<string, string> = {
  '1': '🟢', // low
  '2': '🟡', // medium
  '3': '🟠', // high
  '4': '🔴', // urgent
};

// Status emoji mapping
const STATUS_EMOJI: Record<string, string> = {
  not_started: '⚪',
  in_progress: '🔵',
  completed: '✅',
  blocked: '🚫',
  content: '📝',
  design: '🎨',
  dev: '💻',
  qa: '🔍',
  launch: '🚀',
};

/**
 * Format a task as a rich Slack message block
 */
export function formatTaskAsSlackBlock(
  task: Task,
  project?: Project | null
): SlackBlock[] {
  const priorityEmoji = PRIORITY_EMOJI[task.priorityScore || '2'];
  const statusEmoji = STATUS_EMOJI[task.status || 'not_started'];

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${priorityEmoji} ${task.title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Status:*\n${statusEmoji} ${formatStatus(task.status)}`,
        },
        {
          type: 'mrkdwn',
          text: `*Priority:*\n${priorityEmoji} ${formatPriority(task.priorityScore)}`,
        },
      ],
    },
  ];

  // Add project if available
  if (project) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📁 *Project:* ${project.name}`,
        },
      ],
    });
  }

  // Add description if available
  if (task.description) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          task.description.slice(0, 300) +
          (task.description.length > 300 ? '...' : ''),
      },
    });
  }

  // Add due date if available
  if (task.dueDate) {
    const dueDateText = format(new Date(task.dueDate), 'MMM d, yyyy');
    const isOverdue = new Date(task.dueDate) < new Date();
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 *Due:* ${dueDateText}${isOverdue ? ' ⚠️ *OVERDUE*' : ''}`,
        },
      ],
    });
  }

  // Add action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '✓ Complete',
          emoji: true,
        },
        style: 'primary',
        value: task.id,
        action_id: `task_complete_${task.id}`,
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '👁 View',
          emoji: true,
        },
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/projects/${task.projectId}?task=${task.id}`,
        action_id: `task_view_${task.id}`,
      },
    ],
  });

  return blocks;
}

/**
 * Format multiple tasks as a list in Slack
 */
export function formatTaskListAsSlackBlocks(tasks: Task[]): SlackBlock[] {
  if (tasks.length === 0) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_No tasks found_',
        },
      },
    ];
  }

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `Found ${tasks.length} task${tasks.length === 1 ? '' : 's'}`,
        emoji: true,
      },
    },
  ];

  tasks.slice(0, 10).forEach((task) => {
    const priorityEmoji = PRIORITY_EMOJI[task.priorityScore || '2'];
    const statusEmoji = STATUS_EMOJI[task.status || 'not_started'];

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji} *${task.title}*\n${priorityEmoji} ${formatPriority(task.priorityScore)} • ID: \`${task.id.slice(0, 8)}\``,
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View',
          emoji: true,
        },
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/projects/${task.projectId}?task=${task.id}`,
        action_id: `task_view_${task.id}`,
      },
    });
  });

  if (tasks.length > 10) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Showing 10 of ${tasks.length} tasks_`,
        },
      ],
    });
  }

  return blocks;
}

/**
 * Format a daily standup message
 */
export function formatDailyStandupBlocks(data: {
  userName: string;
  todayTasks: Task[];
  overdueTasks: Task[];
  completedYesterday: Task[];
}): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📊 Daily Standup for ${data.userName}`,
        emoji: true,
      },
    },
  ];

  // Completed yesterday
  if (data.completedYesterday.length > 0) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*✅ Completed Yesterday (${data.completedYesterday.length})*`,
        },
      },
      ...data.completedYesterday.slice(0, 5).map((task) => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${task.title}`,
        },
      }))
    );
  }

  // Today's tasks
  if (data.todayTasks.length > 0) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📅 Today's Tasks (${data.todayTasks.length})*`,
        },
      },
      ...data.todayTasks.slice(0, 5).map((task) => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${PRIORITY_EMOJI[task.priorityScore || '2']} ${task.title}`,
        },
      }))
    );
  }

  // Overdue tasks
  if (data.overdueTasks.length > 0) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚠️ Overdue Tasks (${data.overdueTasks.length})*`,
        },
      },
      ...data.overdueTasks.slice(0, 5).map((task) => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${task.title} - Due: ${task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}`,
        },
      }))
    );
  }

  // Summary
  blocks.push({
    type: 'divider',
  });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `_Generated at ${format(new Date(), 'h:mm a')}_`,
      },
    ],
  });

  return blocks;
}

/**
 * Parse a Slack slash command text
 */
export function parseSlashCommand(text: string): {
  action: string;
  args: string[];
  fullText: string;
} {
  const parts = text.trim().split(/\s+/);
  const action = parts[0] || '';
  const args = parts.slice(1);

  return {
    action: action.toLowerCase(),
    args,
    fullText: text.trim(),
  };
}

/**
 * Create error response for Slack
 */
export function slackErrorResponse(message: string): SlackBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ *Error:* ${message}`,
      },
    },
  ];
}

/**
 * Create success response for Slack
 */
export function slackSuccessResponse(message: string): SlackBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ ${message}`,
      },
    },
  ];
}

// Helper functions
function formatStatus(status: string | null): string {
  if (!status) return 'To Do';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatPriority(priorityScore: string | null): string {
  if (!priorityScore) return 'Medium';
  const priorityMap: Record<string, string> = {
    '1': 'Low',
    '2': 'Medium',
    '3': 'High',
    '4': 'Urgent',
  };
  return priorityMap[priorityScore] || 'Medium';
}
