import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/server/db';
import { integrationApiKeys } from '@/server/db/schema';

const BURST_WINDOW_MS = 10_000;
const BURST_MAX = 20;
const SUSTAINED_WINDOW_MS = 10 * 60_000;
const SUSTAINED_MAX = 100;

type Bucket = { count: number; resetAt: number };
type IdeaForgeAuth = { userId: string; keyId: string; keyHash: string };

const ipBurstBuckets = new Map<string, Bucket>();
const ipSustainedBuckets = new Map<string, Bucket>();
const keyBurstBuckets = new Map<string, Bucket>();
const keySustainedBuckets = new Map<string, Bucket>();

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

function isRateLimited(ip: string, key: string): boolean {
  const burstOk =
    checkBucket(ipBurstBuckets, ip, BURST_WINDOW_MS, BURST_MAX) &&
    checkBucket(keyBurstBuckets, key, BURST_WINDOW_MS, BURST_MAX);
  const sustainedOk =
    checkBucket(ipSustainedBuckets, ip, SUSTAINED_WINDOW_MS, SUSTAINED_MAX) &&
    checkBucket(
      keySustainedBuckets,
      key,
      SUSTAINED_WINDOW_MS,
      SUSTAINED_MAX
    );

  return !(burstOk && sustainedOk);
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function requireIdeaForgeAuth(req: Request): Promise<
  | { auth: IdeaForgeAuth }
  | {
      response: NextResponse;
    }
> {
  const token = extractBearerToken(req);
  if (!token) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized: missing bearer token' },
        { status: 401 }
      ),
    };
  }

  const ip = getClientIp(req);
  const keyHash = hashApiKey(token);
  if (isRateLimited(ip, keyHash)) {
    return {
      response: NextResponse.json({ error: 'Too Many Requests' }, { status: 429 }),
    };
  }

  const [key] = await db
    .select({
      id: integrationApiKeys.id,
      userId: integrationApiKeys.userId,
      revokedAt: integrationApiKeys.revokedAt,
    })
    .from(integrationApiKeys)
    .where(
      and(
        eq(integrationApiKeys.keyHash, keyHash),
        eq(integrationApiKeys.integration, 'ideaforge'),
        isNull(integrationApiKeys.revokedAt)
      )
    )
    .limit(1);

  if (!key) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized: invalid integration key' },
        { status: 401 }
      ),
    };
  }

  await db
    .update(integrationApiKeys)
    .set({ lastUsedAt: new Date(), updatedAt: new Date() })
    .where(eq(integrationApiKeys.id, key.id));

  return {
    auth: {
      userId: key.userId,
      keyId: key.id,
      keyHash,
    },
  };
}

export async function parseJsonBody(req: Request): Promise<
  | { data: unknown }
  | { response: NextResponse }
> {
  try {
    return { data: await req.json() };
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      ),
    };
  }
}
