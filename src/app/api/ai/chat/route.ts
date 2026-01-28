import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { aiChatMessages, aiChatSessions } from '@/server/db/schema';
import { desc, eq, and } from 'drizzle-orm';

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

function isRateLimited(key: string, isUser: boolean): boolean {
  const burstBuckets = isUser ? userBurstBuckets : ipBurstBuckets;
  const sustainedBuckets = isUser ? userSustainedBuckets : ipSustainedBuckets;

  const burstOk = checkBucket(burstBuckets, key, BURST_WINDOW_MS, BURST_MAX);
  const sustainedOk = checkBucket(
    sustainedBuckets,
    key,
    SUSTAINED_WINDOW_MS,
    SUSTAINED_MAX
  );

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
  mode?: 'analytics' | 'project' | 'general' | 'pattern4';
  tags?: Record<string, unknown>;
}) {
  const tagContext =
    params.tags && Object.keys(params.tags).length > 0
      ? `\nTAG CONTEXT:\n${JSON.stringify(params.tags, null, 2)}\n`
      : '';

  const modeIntro = params.mode
    ? `You are a ${params.mode} AI assistant for TaskTracker AI.`
    : 'You are an AI assistant for TaskTracker AI.';

  return `${modeIntro}
${tagContext}
You help users plan, analyze, and understand their work. Be concise and actionable.
If the user asks to create, update, or delete data, explain the steps they should take in the app.`;
}

async function getOrCreateSession(params: {
  userId: string;
  sessionId?: string | null;
  message: string;
}) {
  const { userId, sessionId, message } = params;

  if (sessionId) {
    const [existing] = await db
      .select({ id: aiChatSessions.id })
      .from(aiChatSessions)
      .where(and(eq(aiChatSessions.id, sessionId), eq(aiChatSessions.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new Error('Chat session not found');
    }

    return { id: existing.id, isNew: false };
  }

  const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
  const [created] = await db
    .insert(aiChatSessions)
    .values({ userId, title })
    .returning();

  return { id: created.id, isNew: true };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip, false) || isRateLimited(session.user.id, true)) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429 }
      );
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

    const message = payload?.message;
    const originalMessage = payload?.originalMessage;
    const tags = payload?.tags;
    const context = payload?.context;
    const sessionId = payload?.sessionId;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const sessionInfo = await getOrCreateSession({
      userId,
      sessionId,
      message,
    });

    const recentMessages = await db
      .select({ role: aiChatMessages.role, content: aiChatMessages.content })
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionInfo.id))
      .orderBy(desc(aiChatMessages.createdAt))
      .limit(10);

    const history = [...recentMessages].reverse().map((msg) => ({
      role: (msg.role as any) === 'tool' ? 'tool' : (msg.role as 'user' | 'assistant'),
      content: msg.content,
    }));

    await db.insert(aiChatMessages).values({
      sessionId: sessionInfo.id,
      role: 'user',
      content: message,
      metadata: {
        originalMessage: originalMessage || null,
        tags: tags || null,
        context: context || null,
      },
    });

    const systemPrompt = buildSystemPrompt({
      mode: context?.mode,
      tags,
    });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history as any[]),
        { role: 'user', content: message },
      ],
      temperature: 0.4,
      max_tokens: 900,
    });

    const aiMessage =
      completion.choices[0]?.message?.content ||
      "I'm not sure how to respond to that.";

    await db.insert(aiChatMessages).values({
      sessionId: sessionInfo.id,
      role: 'assistant',
      content: aiMessage,
      metadata: {
        model: 'gpt-4o-mini',
      },
    });

    await db
      .update(aiChatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(aiChatSessions.id, sessionInfo.id));

    return NextResponse.json({
      message: aiMessage,
      sessionId: sessionInfo.id,
    });
  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
