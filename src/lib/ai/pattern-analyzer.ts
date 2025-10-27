import { db } from '@/server/db';
import { taskAnalytics, userPatterns, tasks } from '@/server/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface ProductivityPattern {
  userId: string;
  completionTimes: Record<string, number>; // priority -> avg minutes
  productiveHours: number[]; // hours of day (0-23) when most productive
  taskCategoryDuration: Record<string, number>; // role -> avg minutes
  postponementPattern: {
    mostPostponedTypes: string[];
    avgPostponementDays: number;
  };
  velocity: {
    tasksPerDay: number;
    tasksPerWeek: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  confidenceScore: number;
}

/**
 * Analyzes user task completion data to extract productivity patterns
 */
export class PatternAnalyzer {
  /**
   * Analyze all patterns for a user and update the database
   */
  async analyzeUserPatterns(userId: string): Promise<ProductivityPattern> {
    const [
      completionTimes,
      productiveHours,
      taskCategoryDuration,
      postponementPattern,
      velocity,
    ] = await Promise.all([
      this.analyzeCompletionTimes(userId),
      this.analyzeProductiveHours(userId),
      this.analyzeTaskCategoryDuration(userId),
      this.analyzePostponementPattern(userId),
      this.analyzeVelocity(userId),
    ]);

    // Calculate overall confidence based on data availability
    const confidence = await this.calculateConfidence(userId);

    const pattern: ProductivityPattern = {
      userId,
      completionTimes,
      productiveHours,
      taskCategoryDuration,
      postponementPattern,
      velocity,
      confidenceScore: confidence,
    };

    // Store patterns in database
    await this.storePatterns(userId, pattern);

    return pattern;
  }

  /**
   * Analyze average completion times by priority
   */
  private async analyzeCompletionTimes(
    userId: string
  ): Promise<Record<string, number>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await db
      .select({
        priority: tasks.priorityScore,
        duration: taskAnalytics.actualDurationMinutes,
      })
      .from(taskAnalytics)
      .innerJoin(tasks, eq(taskAnalytics.taskId, tasks.id))
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    // Group by priority and calculate averages
    const groups: Record<string, number[]> = {
      '1': [],
      '2': [],
      '3': [],
      '4': [],
    };

    analytics.forEach((record) => {
      if (record.duration && record.priority) {
        groups[record.priority].push(record.duration);
      }
    });

    return Object.fromEntries(
      Object.entries(groups).map(([priority, durations]) => [
        priority,
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0,
      ])
    );
  }

  /**
   * Analyze when user is most productive (hours of day)
   */
  private async analyzeProductiveHours(userId: string): Promise<number[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completions = await db
      .select({
        completedAt: taskAnalytics.completedAt,
      })
      .from(taskAnalytics)
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    // Count completions by hour
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    completions.forEach((record) => {
      if (record.completedAt) {
        const hour = new Date(record.completedAt).getHours();
        hourCounts[hour]++;
      }
    });

    // Return top 3 most productive hours
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return sortedHours;
  }

  /**
   * Analyze average duration by task category (role)
   */
  private async analyzeTaskCategoryDuration(
    userId: string
  ): Promise<Record<string, number>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await db
      .select({
        roleId: tasks.roleId,
        duration: taskAnalytics.actualDurationMinutes,
      })
      .from(taskAnalytics)
      .innerJoin(tasks, eq(taskAnalytics.taskId, tasks.id))
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    // Group by role and calculate averages
    const groups: Record<string, number[]> = {};

    analytics.forEach((record) => {
      if (record.duration && record.roleId) {
        if (!groups[record.roleId]) {
          groups[record.roleId] = [];
        }
        groups[record.roleId].push(record.duration);
      }
    });

    return Object.fromEntries(
      Object.entries(groups).map(([roleId, durations]) => [
        roleId,
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0,
      ])
    );
  }

  /**
   * Analyze postponement patterns (tasks that get rescheduled)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async analyzePostponementPattern(_userId: string): Promise<{
    mostPostponedTypes: string[];
    avgPostponementDays: number;
  }> {
    // This would require tracking rescheduling events
    // For now, return placeholder data
    // TODO: Implement once we track task rescheduling in activity log
    return {
      mostPostponedTypes: [],
      avgPostponementDays: 0,
    };
  }

  /**
   * Analyze task completion velocity and trends
   */
  private async analyzeVelocity(userId: string): Promise<{
    tasksPerDay: number;
    tasksPerWeek: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completions = await db
      .select({
        completedAt: taskAnalytics.completedAt,
      })
      .from(taskAnalytics)
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    const totalTasks = completions.filter((c) => c.completedAt).length;
    const tasksPerDay = totalTasks / 30;
    const tasksPerWeek = tasksPerDay * 7;

    // Calculate trend by comparing first 15 days vs last 15 days
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const recentCount = completions.filter(
      (c) => c.completedAt && new Date(c.completedAt) >= fifteenDaysAgo
    ).length;
    const olderCount = totalTasks - recentCount;

    const recentAvg = recentCount / 15;
    const olderAvg = olderCount / 15;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      tasksPerDay,
      tasksPerWeek,
      trend,
    };
  }

  /**
   * Calculate confidence score based on data availability
   */
  private async calculateConfidence(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskAnalytics)
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    const recordCount = Number(count.count);

    // Confidence score based on number of data points
    // 0-10 records: 0.3
    // 11-30 records: 0.5
    // 31-50 records: 0.7
    // 51+ records: 0.9
    if (recordCount < 10) return 0.3;
    if (recordCount < 30) return 0.5;
    if (recordCount < 50) return 0.7;
    return 0.9;
  }

  /**
   * Store analyzed patterns in the database
   */
  private async storePatterns(userId: string, pattern: ProductivityPattern) {
    // Store each pattern type separately for flexibility
    const patterns = [
      {
        type: 'completion_time' as const,
        data: pattern.completionTimes,
      },
      {
        type: 'productive_hours' as const,
        data: { hours: pattern.productiveHours },
      },
      {
        type: 'task_category_duration' as const,
        data: pattern.taskCategoryDuration,
      },
      {
        type: 'postponement_pattern' as const,
        data: pattern.postponementPattern,
      },
      {
        type: 'velocity' as const,
        data: pattern.velocity,
      },
    ];

    for (const { type, data } of patterns) {
      // Check if pattern exists
      const [existing] = await db
        .select()
        .from(userPatterns)
        .where(
          and(
            eq(userPatterns.userId, userId),
            eq(userPatterns.patternType, type)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing
        await db
          .update(userPatterns)
          .set({
            patternData: data,
            confidenceScore: pattern.confidenceScore,
            lastUpdated: new Date(),
          })
          .where(eq(userPatterns.id, existing.id));
      } else {
        // Create new
        await db.insert(userPatterns).values({
          userId,
          patternType: type,
          patternData: data,
          confidenceScore: pattern.confidenceScore,
        });
      }
    }
  }

  /**
   * Get stored patterns for a user
   */
  async getStoredPatterns(userId: string): Promise<ProductivityPattern | null> {
    const patterns = await db
      .select()
      .from(userPatterns)
      .where(eq(userPatterns.userId, userId));

    if (patterns.length === 0) return null;

    const pattern: any = { userId };

    patterns.forEach((p) => {
      if (p.patternType === 'completion_time') {
        pattern.completionTimes = p.patternData;
      } else if (p.patternType === 'productive_hours') {
        pattern.productiveHours = (p.patternData as any).hours || [];
      } else if (p.patternType === 'task_category_duration') {
        pattern.taskCategoryDuration = p.patternData;
      } else if (p.patternType === 'postponement_pattern') {
        pattern.postponementPattern = p.patternData;
      } else if (p.patternType === 'velocity') {
        pattern.velocity = p.patternData;
      }
      pattern.confidenceScore = p.confidenceScore;
    });

    return pattern as ProductivityPattern;
  }
}

// Singleton instance
export const patternAnalyzer = new PatternAnalyzer();
