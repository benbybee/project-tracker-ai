import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { ideaforgeIdeas, ideaforgeTranscripts, ideaforgeUserMemory } from '@/server/db/schema/ideaforge';
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

function buildSystemPrompt(params: {
  idea: { title: string; oneLiner?: string | null; notes?: string | null };
  aiMode: 'freeform' | 'guided' | 'critical';
  memoryProfile?: Record<string, unknown> | null;
}) {
  const modeIntro = {
    freeform:
      'You are a critical yet constructive IdeaForge exploration assistant. Challenge assumptions and surface risks.',
    guided:
      'You are a probing IdeaForge assistant. Ask one sharp question at a time and wait for answers.',
    critical:
      'You are a direct, challenging IdeaForge reviewer. Be concise and push back hard on weak logic.',
  }[params.aiMode];

  const memory =
    params.memoryProfile && Object.keys(params.memoryProfile).length > 0
      ? `\nUSER MEMORY PROFILE:\n${JSON.stringify(params.memoryProfile, null, 2)}\n`
      : '';

  return `${modeIntro}

IDEA CONTEXT:
Title: ${params.idea.title}
One-liner: ${params.idea.oneLiner ?? 'N/A'}
Notes: ${params.idea.notes ?? 'N/A'}
${memory}
Rules:
- Keep responses actionable and concise.
- Surface risks, assumptions, and unknowns.
- If guided, ask one question only.`;
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
    const message = payload?.message as string | undefined;
    const aiMode = payload?.mode as 'freeform' | 'guided' | 'critical' | undefined;
    const inputMode = payload?.inputMode as 'text' | 'voice' | undefined;

    if (!ideaId || !message || !aiMode) {
      return NextResponse.json(
        { error: 'ideaId, message, and mode are required' },
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

    const systemPrompt = buildSystemPrompt({
      idea,
      aiMode,
      memoryProfile: (memory?.profile as Record<string, unknown>) ?? null,
    });

    await db.insert(ideaforgeTranscripts).values({
      userId: session.user.id,
      ideaId: ideaId,
      role: 'user',
      mode: inputMode ?? 'text',
      aiMode,
      content: message,
    });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '';

    await db.insert(ideaforgeTranscripts).values({
      userId: session.user.id,
      ideaId: ideaId,
      role: 'assistant',
      mode: inputMode ?? 'text',
      aiMode,
      content: reply,
      metadata: { model: 'gpt-4o-mini' },
    });

    await db
      .update(ideaforgeIdeas)
      .set({
        lastExploredAt: new Date(),
        status: 'EXPLORING',
        updatedAt: new Date(),
      })
      .where(eq(ideaforgeIdeas.id, ideaId));

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('IdeaForge explore error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to explore idea' },
      { status: 500 }
    );
  }
}
