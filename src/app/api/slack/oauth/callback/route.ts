/**
 * Slack OAuth Callback Handler
 * Endpoint: /api/slack/oauth/callback
 * Handles OAuth callback from Slack
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { slackIntegrations } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?slack_error=${error}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?slack_error=no_code', req.url)
      );
    }

    // Exchange code for access token
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/slack/oauth/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Slack OAuth credentials not configured');
    }

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      throw new Error(tokenData.error || 'Failed to exchange OAuth code');
    }

    // Get bot info (optional verification)
    // const botInfo = await fetch('https://slack.com/api/auth.test', {
    //   headers: {
    //     Authorization: `Bearer ${tokenData.access_token}`,
    //   },
    // }).then((res) => res.json());

    // Check if integration already exists
    const [existing] = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.teamId, tokenData.team.id))
      .limit(1);

    if (existing) {
      // Update existing integration
      await db
        .update(slackIntegrations)
        .set({
          accessToken: tokenData.access_token,
          botUserId: tokenData.bot_user_id,
          botAccessToken: tokenData.access_token,
          scope: tokenData.scope,
          teamName: tokenData.team.name,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(slackIntegrations.id, existing.id));
    } else {
      // Create new integration
      await db.insert(slackIntegrations).values({
        userId: session.user.id,
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
        accessToken: tokenData.access_token,
        botUserId: tokenData.bot_user_id,
        botAccessToken: tokenData.access_token,
        scope: tokenData.scope,
        isActive: true,
      });
    }

    return NextResponse.redirect(
      new URL('/settings?slack_success=true', req.url)
    );
  } catch (error: any) {
    console.error('Slack OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `/settings?slack_error=${encodeURIComponent(error.message)}`,
        req.url
      )
    );
  }
}
