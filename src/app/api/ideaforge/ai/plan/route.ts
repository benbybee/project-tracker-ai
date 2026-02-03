import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { ideaforgeIdeas, ideaforgeUserMemory } from '@/server/db/schema/ideaforge';
import { and, eq } from 'drizzle-orm';

const BURST_WINDOW_MS = 10_000;
const BURST_MAX = 20;
const SUSTAINED_WINDOW_MS = 10 * 60_000;
const SUSTAINED_MAX = 100;

type Bucket = { count: number; resetAt: number };

const ipBurstBuckets = new Map<string, Bucket>();
const ipSustainedBuckets = new Map<string, Bucket>();
const userBurstBuckets = new Map<string, Bucket>();
const userSustainedBuckets = new Map<string, Bucket>();

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkBucket(
  buckets: Map<string, Bucket>,
  key: string,
  windowMs: number,
  max: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function isRateLimited(ip: string, userId: string): boolean {
  const burstOk =
    checkBucket(ipBurstBuckets, ip, BURST_WINDOW_MS, BURST_MAX) &&
    checkBucket(userBurstBuckets, userId, BURST_WINDOW_MS, BURST_MAX);
  const sustainedOk =
    checkBucket(ipSustainedBuckets, ip, SUSTAINED_WINDOW_MS, SUSTAINED_MAX) &&
    checkBucket(userSustainedBuckets, userId, SUSTAINED_WINDOW_MS, SUSTAINED_MAX);

  return !(burstOk && sustainedOk);
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

function buildPlanPrompt(params: {
  idea: { title: string; oneLiner?: string | null; notes?: string | null };
  scheduleMode: 'realistic' | 'aggressive' | 'deadline';
  memoryProfile?: Record<string, unknown> | null;
}) {
  const memory =
    params.memoryProfile && Object.keys(params.memoryProfile).length > 0
      ? `\nUSER MEMORY PROFILE:\n${JSON.stringify(params.memoryProfile, null, 2)}\n`
      : '';

  return `You are an IdeaForge planning assistant. Generate 5-8 actionable tasks for execution.

IDEA CONTEXT:
Title: ${params.idea.title}
One-liner: ${params.idea.oneLiner ?? 'N/A'}
Notes: ${params.idea.notes ?? 'N/A'}
Schedule mode: ${params.scheduleMode}
${memory}

Return ONLY valid JSON in this exact shape:
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": 1,
      "dueDate": "YYYY-MM-DD" | null,
      "budgetPlanned": "string" | null,
      "dependencies": "comma-separated list" | null
    }
  ]
}

Rules:
- 5 to 8 tasks.
- Priorities are 1-4.
- Due dates optional. Use null if not needed.
- Keep descriptions concise.`;
}

function safeParseJson(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    const match = payload.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse JSON from model response');
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip, session.user.id)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const ideaId = payload?.ideaId as string | undefined;
    const scheduleMode = payload?.scheduleMode as
      | 'realistic'
      | 'aggressive'
      | 'deadline'
      | undefined;

    if (!ideaId || !scheduleMode) {
      return NextResponse.json(
        { error: 'ideaId and scheduleMode are required' },
        { status: 400 }
      );
    }

    const [idea] = await db
      .select({
        id: ideaforgeIdeas.id,
        title: ideaforgeIdeas.title,
        oneLiner: ideaforgeIdeas.oneLiner,
        notes: ideaforgeIdeas.notes,
      })
      .from(ideaforgeIdeas)
      .where(and(eq(ideaforgeIdeas.id, ideaId), eq(ideaforgeIdeas.userId, session.user.id)))
      .limit(1);

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const [memory] = await db
      .select({ profile: ideaforgeUserMemory.profile })
      .from(ideaforgeUserMemory)
      .where(eq(ideaforgeUserMemory.userId, session.user.id))
      .limit(1);

    const prompt = buildPlanPrompt({
      idea,
      scheduleMode,
      memoryProfile: (memory?.profile as Record<string, unknown>) ?? null,
    });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';
    const parsed = safeParseJson(content);

    if (!parsed?.tasks || !Array.isArray(parsed.tasks)) {
      return NextResponse.json(
        { error: 'Model response missing tasks' },
        { status: 422 }
      );
    }

    return NextResponse.json({ tasks: parsed.tasks });
  } catch (error: any) {
    console.error('IdeaForge plan error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
