import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/server/auth';

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

    const text = payload?.text as string | undefined;
    const voice = (payload?.voice as string | undefined) ?? 'alloy';

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const speech = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      format: 'mp3',
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('IdeaForge TTS error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
