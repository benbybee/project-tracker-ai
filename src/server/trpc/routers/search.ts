import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { tasks, projects } from '@/server/db/schema';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
const client =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-dummy-key'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export const searchRouter = createTRPCRouter({
  query: protectedProcedure
    .input(z.object({ q: z.string().min(2), topK: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        // Return empty results if OpenAI client is not available
        if (!client) {
          return [];
        }

        const { data } = await client.embeddings.create({
          model: 'text-embedding-3-small',
          input: input.q,
        });
        const vec = data[0]?.embedding;

        if (!vec) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate embedding',
          });
        }

        const rows = await ctx.db.execute(sql`
          SELECT entity_type, entity_id, chunk_text
          FROM embeddings
          ORDER BY embedding <-> ${sql.raw(JSON.stringify(vec))} 
          LIMIT ${input.topK}
        `);

        // hydrate entities
        const results = [];
        for (const r of rows as any[]) {
          if (r.entity_type === 'task') {
            const [t] = await ctx.db
              .select()
              .from(tasks)
              .where(sql`id = ${r.entity_id}`)
              .limit(1);
            if (t)
              results.push({ kind: 'task', item: t, snippet: r.chunk_text });
          } else {
            const [p] = await ctx.db
              .select()
              .from(projects)
              .where(sql`id = ${r.entity_id}`)
              .limit(1);
            if (p)
              results.push({ kind: 'project', item: p, snippet: r.chunk_text });
          }
        }
        return results;
      } catch (error) {
        console.error('Search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Search failed',
        });
      }
    }),
});
