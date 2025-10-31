import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '@/server/db';
import {
  taskAnalytics,
  userPatterns,
  aiSuggestions,
  tasks,
} from '@/server/db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

export const analyticsRouter = createTRPCRouter({
  // Record when a task starts (status changes to in_progress)
  recordTaskStart: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [record] = await db
        .insert(taskAnalytics)
        .values({
          taskId: input.taskId,
          userId: ctx.session.user.id,
          startedAt: new Date(),
        })
        .returning();

      return record;
    }),

  // Record when a task completes
  recordTaskCompletion: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        estimatedMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the most recent started record for this task
      const [latestRecord] = await db
        .select()
        .from(taskAnalytics)
        .where(
          and(
            eq(taskAnalytics.taskId, input.taskId),
            eq(taskAnalytics.userId, ctx.session.user.id)
          )
        )
        .orderBy(desc(taskAnalytics.createdAt))
        .limit(1);

      const completedAt = new Date();

      if (latestRecord && latestRecord.startedAt) {
        // Update existing record with completion time
        const durationMs =
          completedAt.getTime() - latestRecord.startedAt.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));

        const [updated] = await db
          .update(taskAnalytics)
          .set({
            completedAt,
            actualDurationMinutes: durationMinutes,
            estimatedDurationMinutes: input.estimatedMinutes,
          })
          .where(eq(taskAnalytics.id, latestRecord.id))
          .returning();

        return updated;
      } else {
        // Create new completion record without start time
        const [record] = await db
          .insert(taskAnalytics)
          .values({
            taskId: input.taskId,
            userId: ctx.session.user.id,
            completedAt,
            estimatedDurationMinutes: input.estimatedMinutes,
          })
          .returning();

        return record;
      }
    }),

  // Get task completion statistics for the user
  getCompletionStats: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        roleId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      // Get all completed task analytics
      const analytics = await db
        .select({
          analytics: taskAnalytics,
          task: {
            id: tasks.id,
            roleId: tasks.roleId,
            priorityScore: tasks.priorityScore,
            status: tasks.status,
          },
        })
        .from(taskAnalytics)
        .leftJoin(tasks, eq(taskAnalytics.taskId, tasks.id))
        .where(
          and(
            eq(taskAnalytics.userId, ctx.session.user.id),
            gte(taskAnalytics.createdAt, since)
          )
        );

      // Calculate statistics
      const completed = analytics.filter((a) => a.analytics.completedAt);
      const withDuration = completed.filter(
        (a) => a.analytics.actualDurationMinutes
      );

      // Average duration by priority
      const durationByPriority: Record<string, number[]> = {
        '1': [],
        '2': [],
        '3': [],
        '4': [],
      };

      withDuration.forEach((a) => {
        const priority = a.task?.priorityScore || '2';
        if (a.analytics.actualDurationMinutes) {
          durationByPriority[priority].push(a.analytics.actualDurationMinutes);
        }
      });

      const avgDurationByPriority = Object.fromEntries(
        Object.entries(durationByPriority).map(([priority, durations]) => [
          priority,
          durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0,
        ])
      );

      // Calculate velocity (tasks completed per day)
      const velocity = completed.length / input.days;

      return {
        totalCompleted: completed.length,
        avgDurationByPriority,
        velocity,
        totalWithDuration: withDuration.length,
      };
    }),

  // Get or create user patterns
  getUserPatterns: protectedProcedure
    .input(
      z.object({
        patternType: z
          .enum([
            'completion_time',
            'productive_hours',
            'task_category_duration',
            'postponement_pattern',
            'velocity',
          ])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(userPatterns.userId, ctx.session.user.id)];

      if (input.patternType) {
        whereConditions.push(eq(userPatterns.patternType, input.patternType));
      }

      const patterns = await db
        .select()
        .from(userPatterns)
        .where(and(...whereConditions))
        .orderBy(desc(userPatterns.lastUpdated));

      return patterns;
    }),

  // Update user pattern (used by pattern analyzer)
  updatePattern: protectedProcedure
    .input(
      z.object({
        patternType: z.enum([
          'completion_time',
          'productive_hours',
          'task_category_duration',
          'postponement_pattern',
          'velocity',
        ]),
        patternData: z.any(),
        confidenceScore: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if pattern exists
      const [existing] = await db
        .select()
        .from(userPatterns)
        .where(
          and(
            eq(userPatterns.userId, ctx.session.user.id),
            eq(userPatterns.patternType, input.patternType)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing pattern
        const [updated] = await db
          .update(userPatterns)
          .set({
            patternData: input.patternData,
            confidenceScore: input.confidenceScore ?? existing.confidenceScore,
            lastUpdated: new Date(),
          })
          .where(eq(userPatterns.id, existing.id))
          .returning();

        return updated;
      } else {
        // Create new pattern
        const [created] = await db
          .insert(userPatterns)
          .values({
            userId: ctx.session.user.id,
            patternType: input.patternType,
            patternData: input.patternData,
            confidenceScore: input.confidenceScore ?? 0.5,
          })
          .returning();

        return created;
      }
    }),

  // Log AI suggestion
  logSuggestion: protectedProcedure
    .input(
      z.object({
        suggestionType: z.enum([
          'daily_plan',
          'task_priority',
          'time_estimate',
          'schedule',
          'focus_block',
          'break_reminder',
        ]),
        taskId: z.string().optional(),
        suggestionData: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [suggestion] = await db
        .insert(aiSuggestions)
        .values({
          userId: ctx.session.user.id,
          suggestionType: input.suggestionType,
          taskId: input.taskId,
          suggestionData: input.suggestionData,
        })
        .returning();

      return suggestion;
    }),

  // Record user response to suggestion
  respondToSuggestion: protectedProcedure
    .input(
      z.object({
        suggestionId: z.string(),
        accepted: z.any(), // Can be boolean or object for partial acceptance
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(aiSuggestions)
        .set({
          accepted: input.accepted,
          feedback: input.feedback,
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(aiSuggestions.id, input.suggestionId),
            eq(aiSuggestions.userId, ctx.session.user.id)
          )
        )
        .returning();

      return updated;
    }),

  // Get AI suggestion statistics (for learning)
  getSuggestionStats: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const suggestions = await db
        .select()
        .from(aiSuggestions)
        .where(
          and(
            eq(aiSuggestions.userId, ctx.session.user.id),
            gte(aiSuggestions.createdAt, since)
          )
        );

      // Calculate acceptance rates by type
      const statsByType: Record<
        string,
        { total: number; accepted: number; rejected: number }
      > = {};

      suggestions.forEach((s) => {
        if (!statsByType[s.suggestionType]) {
          statsByType[s.suggestionType] = {
            total: 0,
            accepted: 0,
            rejected: 0,
          };
        }
        statsByType[s.suggestionType].total++;

        if (s.accepted === true) {
          statsByType[s.suggestionType].accepted++;
        } else if (s.accepted === false) {
          statsByType[s.suggestionType].rejected++;
        }
      });

      // Calculate acceptance rates
      const acceptanceRates = Object.fromEntries(
        Object.entries(statsByType).map(([type, stats]) => [
          type,
          stats.total > 0 ? stats.accepted / stats.total : 0,
        ])
      );

      return {
        statsByType,
        acceptanceRates,
        totalSuggestions: suggestions.length,
      };
    }),

  // Get comprehensive dashboard analytics
  getDashboardAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get all completed task analytics in the date range
      const completedTasks = await db
        .select({
          analytics: taskAnalytics,
          task: tasks,
        })
        .from(taskAnalytics)
        .leftJoin(tasks, eq(taskAnalytics.taskId, tasks.id))
        .where(
          and(
            eq(taskAnalytics.userId, userId),
            gte(taskAnalytics.completedAt, input.startDate),
            gte(taskAnalytics.completedAt, input.endDate)
          )
        );

      // Calculate daily completion counts
      const dailyCounts = new Map<string, number>();
      completedTasks.forEach((item) => {
        if (item.analytics.completedAt) {
          const date = item.analytics.completedAt.toISOString().split('T')[0];
          dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
        }
      });

      // Calculate hourly/daily heatmap data
      const heatmapData = new Map<string, number>();
      completedTasks.forEach((item) => {
        if (item.analytics.completedAt) {
          const date = new Date(item.analytics.completedAt);
          const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
            date.getDay()
          ];
          const hour = date.getHours();
          const key = `${day}-${hour}`;
          heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
        }
      });

      return {
        dailyCounts: Array.from(dailyCounts.entries()).map(([date, count]) => ({
          date,
          count,
        })),
        heatmapData: Array.from(heatmapData.entries()).map(([key, count]) => {
          const [day, hour] = key.split('-');
          return { day, hour: parseInt(hour), count };
        }),
        totalCompleted: completedTasks.length,
      };
    }),

  // Get AI-powered insights and predictions
  getAiInsights: protectedProcedure.query(async ({ ctx }) => {
    console.error('[Analytics.getAiInsights] Starting for user:', ctx.session.user.id);
    
    try {
      const { patternAnalyzer } = await import('@/lib/ai/pattern-analyzer');
      const { predictiveEngine } = await import('@/lib/ai/predictive-engine');

      const userId = ctx.session.user.id;

      // Get user patterns with error handling
      let userPatterns = null;
      try {
        console.error('[Analytics.getAiInsights] Fetching stored patterns...');
        const patterns = await patternAnalyzer.getStoredPatterns(userId);

        // If no patterns exist, analyze them first
        userPatterns = patterns;
        if (!userPatterns) {
          console.error('[Analytics.getAiInsights] No patterns found, analyzing...');
          try {
            userPatterns = await patternAnalyzer.analyzeUserPatterns(userId);
            console.error('[Analytics.getAiInsights] Patterns analyzed successfully');
          } catch (error: any) {
            console.error('[Analytics.getAiInsights] Error analyzing patterns:', {
              error: error.message,
              stack: error.stack,
            });
            userPatterns = null;
          }
        } else {
          console.error('[Analytics.getAiInsights] Patterns fetched successfully');
        }
      } catch (error: any) {
        console.error('[Analytics.getAiInsights] Error fetching patterns:', {
          error: error.message,
          stack: error.stack,
        });
        userPatterns = null;
      }

      // Get workload analysis with error handling
      let workloadAnalysis;
      try {
        console.error('[Analytics.getAiInsights] Analyzing workload...');
        workloadAnalysis = await predictiveEngine.analyzeWorkload(userId);
        console.error('[Analytics.getAiInsights] Workload analyzed successfully');
      } catch (error: any) {
        console.error('[Analytics.getAiInsights] Error analyzing workload:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to analyze workload: ${error.message}`);
      }

      // Get weekly forecast with error handling
      let weeklyForecast;
      try {
        console.error('[Analytics.getAiInsights] Fetching weekly forecast...');
        weeklyForecast = await predictiveEngine.getWeeklyForecast(userId);
        console.error('[Analytics.getAiInsights] Weekly forecast fetched successfully');
      } catch (error: any) {
        console.error('[Analytics.getAiInsights] Error fetching forecast:', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error(`Failed to fetch weekly forecast: ${error.message}`);
      }

      // Get high-risk tasks with error handling
      let highRiskTasks = [];
      try {
        console.error('[Analytics.getAiInsights] Fetching active tasks...');
        const activeTasks = await db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, userId),
              eq(tasks.archived, false),
              sql`${tasks.status} IN ('not_started', 'in_progress')`
            )
          )
          .limit(20);

        console.error('[Analytics.getAiInsights] Assessing task risks...');
        const riskAssessments = await Promise.all(
          activeTasks.map((task) =>
            predictiveEngine.assessTaskRisk(userId, task.id).catch((error: any) => {
              console.error('[Analytics.getAiInsights] Risk assessment failed for task:', {
                taskId: task.id,
                error: error.message,
              });
              return null;
            })
          )
        );

        highRiskTasks = riskAssessments
          .filter(
            (r) => r && (r.riskLevel === 'high' || r.riskLevel === 'critical')
          )
          .slice(0, 5);
        
        console.error('[Analytics.getAiInsights] Risk assessments completed');
      } catch (error: any) {
        console.error('[Analytics.getAiInsights] Error with risk assessments:', {
          error: error.message,
          stack: error.stack,
        });
        // Continue with empty high risk tasks
        highRiskTasks = [];
      }

      console.error('[Analytics.getAiInsights] Completed successfully');
      return {
        patterns: userPatterns,
        workload: workloadAnalysis,
        weeklyForecast,
        highRiskTasks,
      };
    } catch (error: any) {
      console.error('[Analytics.getAiInsights] Fatal error:', {
        error: error.message,
        stack: error.stack,
        userId: ctx.session.user.id,
      });
      throw error;
    }
  }),

  // Get prediction for a specific task
  getTaskPrediction: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { predictiveEngine } = await import('@/lib/ai/predictive-engine');

      const [prediction, risk] = await Promise.all([
        predictiveEngine.predictCompletionDate(
          ctx.session.user.id,
          input.taskId
        ),
        predictiveEngine.assessTaskRisk(ctx.session.user.id, input.taskId),
      ]);

      return {
        prediction,
        risk,
      };
    }),

  // Submit feedback on AI suggestion
  submitAiFeedback: protectedProcedure
    .input(
      z.object({
        suggestionId: z.string(),
        accepted: z.boolean(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(aiSuggestions)
        .set({
          accepted: input.accepted,
          feedback: input.feedback,
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(aiSuggestions.id, input.suggestionId),
            eq(aiSuggestions.userId, ctx.session.user.id)
          )
        )
        .returning();

      return updated[0];
    }),
});
