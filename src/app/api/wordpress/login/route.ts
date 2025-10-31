import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth/auth-options';
import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Rate limiting map: userId -> { count, resetTime }
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

const RATE_LIMIT_MAX = 5; // Maximum requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds in milliseconds

/**
 * Rate limiter for WordPress login requests
 * Limits to 5 requests per user per minute
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Create new rate limit window
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(userId);
    }
  }
}

// Clean up rate limits every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

export async function GET(request: NextRequest) {
  try {
    // 1. Validate user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a minute before trying again.',
        },
        { status: 429 }
      );
    }

    // 3. Get projectId from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    // 4. Fetch project and verify ownership
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        domain: projects.domain,
        wpOneClickEnabled: projects.wpOneClickEnabled,
        wpAdminEmail: projects.wpAdminEmail,
        wpApiKey: projects.wpApiKey,
      })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Validate WordPress one-click login is enabled
    if (!project.wpOneClickEnabled) {
      return NextResponse.json(
        { error: 'WordPress one-click login is not enabled for this project' },
        { status: 403 }
      );
    }

    // 6. Validate required WordPress fields
    if (!project.domain || !project.wpAdminEmail || !project.wpApiKey) {
      return NextResponse.json(
        {
          error:
            'WordPress configuration incomplete. Please ensure domain, admin email, and API key are set.',
        },
        { status: 400 }
      );
    }

    // 7. Construct WordPress API URL
    let wordpressUrl = project.domain;
    if (!wordpressUrl.startsWith('http://') && !wordpressUrl.startsWith('https://')) {
      wordpressUrl = `https://${wordpressUrl}`;
    }

    // Remove trailing slash
    wordpressUrl = wordpressUrl.replace(/\/$/, '');

    const magicLoginEndpoint = `${wordpressUrl}/wp-json/magic-login/v1/create`;

    // 8. Call WordPress Magic Login API
    try {
      const wpResponse = await fetch(magicLoginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${project.wpApiKey}`,
        },
        body: JSON.stringify({
          email: project.wpAdminEmail,
        }),
      });

      if (!wpResponse.ok) {
        const errorText = await wpResponse.text();
        console.error('WordPress API error:', errorText);
        
        return NextResponse.json(
          {
            error: `WordPress API error: ${wpResponse.status} ${wpResponse.statusText}`,
            details: errorText,
          },
          { status: 500 }
        );
      }

      const wpData = await wpResponse.json();

      // 9. Validate response contains magic link
      if (!wpData.link && !wpData.url) {
        console.error('WordPress API response missing link:', wpData);
        return NextResponse.json(
          {
            error: 'WordPress API did not return a valid magic link',
            details: wpData,
          },
          { status: 500 }
        );
      }

      const magicLink = wpData.link || wpData.url;

      // 10. Redirect to magic link
      return NextResponse.redirect(magicLink);
    } catch (fetchError: any) {
      console.error('Failed to connect to WordPress API:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to connect to WordPress site',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('WordPress login error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

