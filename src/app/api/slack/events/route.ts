/**
 * Slack Events Handler
 * Endpoint: /api/slack/events
 * Handles Slack events like emoji reactions, messages, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { slackIntegrations } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle events
    if (body.type === 'event_callback') {
      const event = body.event;

      switch (event.type) {
        case 'reaction_added':
          return await handleReactionAdded(event, body.team_id);

        case 'message':
          return await handleMessage(event, body.team_id);

        default:
          return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Slack event error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handle emoji reaction added to a message
 * React with :memo: emoji to create a task from the message
 */
async function handleReactionAdded(event: any, teamId: string) {
  const { reaction, item, user } = event;

  // Check if reaction is memo emoji
  if (reaction !== 'memo') {
    return NextResponse.json({ ok: true });
  }

  // Find integration
  const [integration] = await db
    .select()
    .from(slackIntegrations)
    .where(eq(slackIntegrations.teamId, teamId))
    .limit(1);

  if (!integration) {
    return NextResponse.json({ ok: true });
  }

  // Get message content
  const messageUrl = `https://slack.com/api/conversations.history`;
  const response = await fetch(
    `${messageUrl}?channel=${item.channel}&latest=${item.ts}&limit=1&inclusive=true`,
    {
      headers: {
        Authorization: `Bearer ${integration.botAccessToken}`,
      },
    }
  );

  const data = await response.json();
  if (!data.ok || !data.messages || data.messages.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // const message = data.messages[0];
  // const messageText = message.text || '';

  // TODO: Create task from message
  // Need to implement project selection first since projectId is required
  // For now, just acknowledge the reaction

  // Post confirmation message
  await fetch('https://slack.com/api/chat.postEphemeral', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${integration.botAccessToken}`,
    },
    body: JSON.stringify({
      channel: item.channel,
      user: user,
      text: '✅ Task creation from messages coming soon! Use `/task create` for now.',
    }),
  });

  return NextResponse.json({ ok: true });
}

/**
 * Handle message events
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleMessage(_event: any, _teamId: string) {
  // Handle direct messages to the bot
  // Can implement conversational AI here

  return NextResponse.json({ ok: true });
}
