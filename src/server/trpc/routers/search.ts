import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { tasks, projects } from '@/server/db/schema';
import {
  sql,
  and,
  or,
  like,
  gte,
  lte,
  inArray,
  isNull,
  isNotNull,
} from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import OpenAI from 'openai';

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

export const searchRouter = createTRPCRouter({
  // Semantic search using embeddings
  query: protectedProcedure
    .input(z.object({ q: z.string().min(2), topK: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        // Return empty results if OpenAI client is not available
        const client = getOpenAIClient();
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

  // Advanced filtered search
  advancedSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        statuses: z
          .array(
            z.enum([
              'not_started',
              'in_progress',
              'blocked',
              'completed',
              'content',
              'design',
              'dev',
              'qa',
              'launch',
            ])
          )
          .optional(),
        priorities: z.array(z.enum(['1', '2', '3', '4'])).optional(),
        roleIds: z.array(z.string()).optional(),
        assigneeIds: z.array(z.string()).optional(),
        projectIds: z.array(z.string()).optional(),
        dueDateFrom: z.date().optional(),
        dueDateTo: z.date().optional(),
        hasNoDueDate: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Build WHERE conditions
        const conditions = [];

        // Text search
        if (input.query && input.query.length >= 2) {
          conditions.push(
            or(
              like(tasks.title, `%${input.query}%`),
              like(tasks.description, `%${input.query}%`)
            )
          );
        }

        // Status filter
        if (input.statuses && input.statuses.length > 0) {
          conditions.push(inArray(tasks.status, input.statuses));
        }

        // Priority filter
        if (input.priorities && input.priorities.length > 0) {
          conditions.push(inArray(tasks.priorityScore, input.priorities));
        }

        // Role filter
        if (input.roleIds && input.roleIds.length > 0) {
          conditions.push(inArray(tasks.roleId, input.roleIds));
        }

        // Assignee filter
        if (input.assigneeIds && input.assigneeIds.length > 0) {
          conditions.push(inArray(tasks.userId, input.assigneeIds));
        }

        // Project filter
        if (input.projectIds && input.projectIds.length > 0) {
          conditions.push(inArray(tasks.projectId, input.projectIds));
        }

        // Due date range filter
        if (input.dueDateFrom) {
          conditions.push(
            gte(tasks.dueDate, input.dueDateFrom.toISOString().split('T')[0])
          );
        }
        if (input.dueDateTo) {
          conditions.push(
            lte(tasks.dueDate, input.dueDateTo.toISOString().split('T')[0])
          );
        }

        // No due date filter
        if (input.hasNoDueDate) {
          conditions.push(isNull(tasks.dueDate));
        } else if (input.dueDateFrom || input.dueDateTo) {
          // If date range specified, exclude null dates
          conditions.push(isNotNull(tasks.dueDate));
        }

        // Execute query
        const results = await ctx.db
          .select()
          .from(tasks)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .limit(input.limit)
          .offset(input.offset);

        // Get total count for pagination
        const [countResult] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        return {
          tasks: results,
          total: Number(countResult?.count || 0),
          hasMore: Number(countResult?.count || 0) > input.offset + input.limit,
        };
      } catch (error) {
        console.error('Advanced search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Search failed',
        });
      }
    }),

  // Quick search (simple text search without filters)
  quickSearch: protectedProcedure
    .input(z.object({ q: z.string().min(1), limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        // Search both tasks and projects
        const taskResults = await ctx.db
          .select()
          .from(tasks)
          .where(
            or(
              like(tasks.title, `%${input.q}%`),
              like(tasks.description, `%${input.q}%`)
            )
          )
          .limit(input.limit);

        const projectResults = await ctx.db
          .select()
          .from(projects)
          .where(
            or(
              like(projects.name, `%${input.q}%`),
              like(projects.description, `%${input.q}%`)
            )
          )
          .limit(input.limit);

        return {
          tasks: taskResults.map((t) => ({ kind: 'task' as const, item: t })),
          projects: projectResults.map((p) => ({
            kind: 'project' as const,
            item: p,
          })),
        };
      } catch (error) {
        console.error('Quick search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Search failed',
        });
      }
    }),
});
