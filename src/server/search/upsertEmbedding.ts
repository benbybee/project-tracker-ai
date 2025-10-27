import OpenAI from 'openai';
import { db } from '@/server/db';
import { embeddings } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === 'sk-dummy-key'
  ) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export async function upsertEmbedding(params: {
  entityType: 'task' | 'project';
  entityId: string;
  text: string;
}) {
  const { entityType, entityId, text } = params;
  if (!text?.trim()) return;

  // Skip embedding generation if OpenAI client is not available
  const client = getOpenAIClient();
  if (!client) {
    // Silently skip embedding generation if OpenAI is not configured
    return;
  }

  const { data } = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  const vector = data[0]?.embedding;

  if (!vector) {
    console.error('Failed to generate embedding');
    return;
  }

  // First, try to delete any existing embedding for this entity
  await db
    .delete(embeddings)
    .where(
      and(
        eq(embeddings.entityType, entityType),
        eq(embeddings.entityId, entityId)
      )
    );

  // Then insert the new embedding
  await db.insert(embeddings).values({
    entityType,
    entityId,
    chunkIndex: 0,
    chunkText: text,
    embedding: vector as any,
  });
}
