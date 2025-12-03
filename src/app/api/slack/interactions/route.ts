/**
 * Slack Interactive Messages Handler
 * Endpoint: /api/slack/interactions
 * Handles button clicks and other interactive components
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, slackIntegrations } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { slackSuccessResponse, slackErrorResponse } from '@/lib/slack-utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const payload = JSON.parse((formData.get('payload') as string) || '{}');

    const { type, team, actions } = payload;

    // Find integration
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.teamId, team.id))
      .limit(1);

    if (!integration) {
      return NextResponse.json({
        response_type: 'ephemeral',
        blocks: slackErrorResponse('Integration not found'),
      });
    }

    // Handle different interaction types
    switch (type) {
      case 'block_actions':
        return await handleBlockActions(actions, integration.userId, payload);

      case 'view_submission':
        return await handleViewSubmission(payload);

      default:
        return NextResponse.json({ ok: true });
    }
  } catch (error: any) {
    console.error('Slack interaction error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: slackErrorResponse(error.message || 'An error occurred'),
    });
  }
}

/**
 * Handle block action interactions (button clicks, etc.)
 */
async function handleBlockActions(
  actions: any[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload: any
) {
  const action = actions[0];
  const actionId = action.action_id;

  // Handle task completion
  if (actionId.startsWith('task_complete_')) {
    const taskId = action.value;

    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return NextResponse.json({
        response_type: 'ephemeral',
        blocks: slackErrorResponse('Task not found'),
      });
    }

    // Update task status
    await db
      .update(tasks)
      .set({
        status: 'completed',
      })
      .where(eq(tasks.id, taskId));

    // Return success message
    return NextResponse.json({
      response_type: 'in_channel',
      replace_original: true,
      blocks: slackSuccessResponse(
        `Task "${task.title}" marked as complete! 🎉`
      ),
    });
  }

  // Handle task view (just acknowledge, the URL button handles navigation)
  if (actionId.startsWith('task_view_')) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

/**
 * Handle modal/view submissions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleViewSubmission(_payload: any) {
  // Handle modal submissions (e.g., task creation modal)
  // const values = payload.view.state.values;

  // Extract form values
  // Implementation depends on your modal structure

  return NextResponse.json({ ok: true });
}
