/**
 * Predictive Engine
 *
 * AI-powered predictive algorithms for task completion, risk detection,
 * and workload analysis.
 */

import { db } from '@/server/db';
import { tasks, taskAnalytics, projects } from '@/server/db/schema';
import { eq, and, gte, lte, sql, isNull } from 'drizzle-orm';

export interface CompletionPrediction {
  taskId: string;
  predictedCompletionDate: Date;
  confidence: number;
  reasoning: string;
  factors: {
    complexity: 'low' | 'medium' | 'high';
    historicalAvg: number;
    currentVelocity: number;
    workloadImpact: number;
  };
}

export interface RiskAssessment {
  taskId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: string[];
}

export interface WorkloadAnalysis {
  totalTasks: number;
  totalEstimatedHours: number;
  availableHoursPerDay: number;
  daysToComplete: number;
  overloadWarning: boolean;
  recommendations: string[];
  taskBreakdown: {
    urgent: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
}

/**
 * Predictive Engine Class
 */
export class PredictiveEngine {
  /**
   * Predict task completion date based on historical data and current workload
   */
  async predictCompletionDate(
    userId: string,
    taskId: string
  ): Promise<CompletionPrediction | null> {
    // Get the task
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) return null;

    // Get historical completion times for similar priority tasks
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalTasks = await db
      .select({
        duration: taskAnalytics.actualDurationMinutes,
      })
      .from(taskAnalytics)
      .innerJoin(tasks, eq(taskAnalytics.taskId, tasks.id))
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          eq(tasks.priorityScore, task.priorityScore || '2'),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    // Calculate average duration
    const durations = historicalTasks
      .map((t) => t.duration)
      .filter((d): d is number => d !== null);

    const avgDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 120; // Default 2 hours

    // Get current velocity (tasks per day)
    const recentCompletions = await db
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

    const velocity = recentCompletions.length / 30;

    // Get current workload (in-progress + not started tasks)
    const [workloadResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.archived, false),
          sql`${tasks.status} IN ('not_started', 'in_progress')`
        )
      );

    const currentWorkload = Number(workloadResult.count);

    // Calculate complexity factor
    const hasDescription = !!task.description && task.description.length > 50;
    const isHighPriority = task.priorityScore === '1';
    const complexityScore = (hasDescription ? 1 : 0) + (isHighPriority ? 1 : 0);

    let complexity: 'low' | 'medium' | 'high' = 'medium';
    if (complexityScore === 0) complexity = 'low';
    else if (complexityScore >= 2) complexity = 'high';

    // Adjust duration based on complexity
    let adjustedDuration = avgDuration;
    if (complexity === 'high') adjustedDuration *= 1.5;
    else if (complexity === 'low') adjustedDuration *= 0.7;

    // Calculate workload impact (more tasks = slower completion)
    const workloadMultiplier = 1 + currentWorkload * 0.05; // 5% slower per task in queue
    const finalDuration = adjustedDuration * workloadMultiplier;

    // Calculate predicted completion date
    const hoursToComplete = finalDuration / 60;
    const daysToComplete = Math.ceil(
      hoursToComplete / (velocity > 0 ? 8 / velocity : 8)
    );

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysToComplete);

    // Calculate confidence based on data availability
    const confidence = Math.min(0.9, 0.3 + durations.length * 0.02);

    return {
      taskId: task.id,
      predictedCompletionDate: predictedDate,
      confidence,
      reasoning: `Based on ${durations.length} similar tasks (avg ${Math.round(avgDuration)} min) and current velocity of ${velocity.toFixed(1)} tasks/day`,
      factors: {
        complexity,
        historicalAvg: Math.round(avgDuration),
        currentVelocity: Math.round(velocity * 10) / 10,
        workloadImpact: Math.round(workloadMultiplier * 100) / 100,
      },
    };
  }

  /**
   * Assess risk for a given task
   */
  async assessTaskRisk(
    userId: string,
    taskId: string
  ): Promise<RiskAssessment | null> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) return null;

    const riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    let riskScore = 0;

    // Factor 1: Overdue
    if (task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(task.dueDate);

      if (dueDate < today) {
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        riskFactors.push({
          factor: 'Overdue',
          severity:
            daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low',
          description: `Task is ${daysOverdue} day(s) overdue`,
        });
        riskScore += Math.min(40, daysOverdue * 5);
      } else {
        // Factor: Due soon
        const daysUntilDue = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 2 && task.status === 'not_started') {
          riskFactors.push({
            factor: 'Due Soon',
            severity: 'medium',
            description: `Due in ${daysUntilDue} day(s) and not started`,
          });
          riskScore += 20;
        }
      }
    }

    // Factor 2: Blocked status
    if (task.status === 'blocked') {
      const blockedDate = task.blockedAt
        ? new Date(task.blockedAt)
        : new Date();
      const daysBlocked = Math.floor(
        (new Date().getTime() - blockedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      riskFactors.push({
        factor: 'Blocked',
        severity: daysBlocked > 3 ? 'high' : 'medium',
        description: `Blocked for ${daysBlocked} day(s)${task.blockedReason ? `: ${task.blockedReason}` : ''}`,
      });
      riskScore += Math.min(30, 15 + daysBlocked * 3);
    }

    // Factor 3: High priority but not in progress
    if (task.priorityScore === '1' && task.status === 'not_started') {
      riskFactors.push({
        factor: 'High Priority Not Started',
        severity: 'medium',
        description: 'Critical task has not been started',
      });
      riskScore += 15;
    }

    // Factor 4: Stagnant (in_progress for too long)
    if (task.status === 'in_progress') {
      const [analytics] = await db
        .select()
        .from(taskAnalytics)
        .where(
          and(
            eq(taskAnalytics.taskId, taskId),
            isNull(taskAnalytics.completedAt)
          )
        )
        .orderBy(taskAnalytics.startedAt)
        .limit(1);

      if (analytics?.startedAt) {
        const daysInProgress = Math.floor(
          (new Date().getTime() - new Date(analytics.startedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysInProgress > 7) {
          riskFactors.push({
            factor: 'Stagnant',
            severity: daysInProgress > 14 ? 'high' : 'medium',
            description: `In progress for ${daysInProgress} days with no completion`,
          });
          riskScore += Math.min(25, 10 + daysInProgress * 2);
        }
      }
    }

    // Factor 5: Dependencies/project health
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, task.projectId))
      .limit(1);

    if (project) {
      // Get project task stats
      const [projectStats] = await db
        .select({
          total: sql<number>`count(*)`,
          overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
          blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`,
        })
        .from(tasks)
        .where(and(eq(tasks.projectId, project.id), eq(tasks.archived, false)));

      const overdueRate =
        Number(projectStats.overdue) / Number(projectStats.total);
      const blockedRate =
        Number(projectStats.blocked) / Number(projectStats.total);

      if (overdueRate > 0.3 || blockedRate > 0.2) {
        riskFactors.push({
          factor: 'Project At Risk',
          severity: overdueRate > 0.5 ? 'high' : 'medium',
          description: `Project has ${Math.round(overdueRate * 100)}% overdue tasks`,
        });
        riskScore += 15;
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 45) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskFactors.some((f) => f.factor === 'Overdue')) {
      recommendations.push(
        'Prioritize this task immediately or reschedule with a realistic date'
      );
    }
    if (riskFactors.some((f) => f.factor === 'Blocked')) {
      recommendations.push(
        'Resolve blocking issues or escalate to unblock progress'
      );
    }
    if (riskFactors.some((f) => f.factor === 'Stagnant')) {
      recommendations.push(
        'Break task into smaller subtasks or reassess scope'
      );
    }
    if (riskFactors.some((f) => f.factor === 'Due Soon')) {
      recommendations.push(
        'Start working on this task today to meet the deadline'
      );
    }

    return {
      taskId: task.id,
      riskLevel,
      riskScore,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Analyze current workload and provide capacity insights
   */
  async analyzeWorkload(userId: string): Promise<WorkloadAnalysis> {
    // Get all active tasks
    const activeTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.archived, false),
          sql`${tasks.status} IN ('not_started', 'in_progress')`
        )
      );

    // Categorize by priority
    const taskBreakdown = {
      urgent: activeTasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          t.status !== 'completed'
      ).length,
      highPriority: activeTasks.filter((t) => t.priorityScore === '1').length,
      mediumPriority: activeTasks.filter((t) => t.priorityScore === '2').length,
      lowPriority: activeTasks.filter(
        (t) => t.priorityScore === '3' || t.priorityScore === '4'
      ).length,
    };

    // Get historical completion data for estimation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedAnalytics = await db
      .select({
        duration: taskAnalytics.actualDurationMinutes,
      })
      .from(taskAnalytics)
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    const avgDuration =
      completedAnalytics.length > 0
        ? completedAnalytics.reduce((sum, t) => sum + (t.duration || 0), 0) /
          completedAnalytics.length
        : 90; // Default 1.5 hours

    // Calculate total estimated hours
    const totalEstimatedMinutes = activeTasks.length * avgDuration;
    const totalEstimatedHours =
      Math.round((totalEstimatedMinutes / 60) * 10) / 10;

    // Calculate velocity
    const velocity = completedAnalytics.length / 30; // tasks per day
    const availableHoursPerDay = 6; // Assume 6 productive hours per day

    // Calculate days to complete
    const tasksPerDay = velocity > 0 ? velocity : 5; // default 5 tasks/day
    const daysToComplete = Math.ceil(activeTasks.length / tasksPerDay);

    // Determine if overloaded
    const overloadWarning =
      taskBreakdown.urgent > 5 ||
      daysToComplete > 14 ||
      totalEstimatedHours > 80;

    // Generate recommendations
    const recommendations: string[] = [];

    if (taskBreakdown.urgent > 3) {
      recommendations.push(
        `You have ${taskBreakdown.urgent} overdue tasks. Focus on completing these first.`
      );
    }

    if (daysToComplete > 14) {
      recommendations.push(
        `Your current workload will take ${daysToComplete} days to complete. Consider delegating or deferring low-priority tasks.`
      );
    }

    if (taskBreakdown.lowPriority > taskBreakdown.highPriority * 2) {
      recommendations.push(
        'You have many low-priority tasks. Consider archiving or batching them to focus on high-priority work.'
      );
    }

    if (activeTasks.length > 30) {
      recommendations.push(
        'High task count detected. Break large tasks into smaller, manageable chunks.'
      );
    }

    if (!overloadWarning && recommendations.length === 0) {
      recommendations.push(
        'Your workload is manageable. Keep up the good work!'
      );
    }

    return {
      totalTasks: activeTasks.length,
      totalEstimatedHours,
      availableHoursPerDay,
      daysToComplete,
      overloadWarning,
      recommendations,
      taskBreakdown,
    };
  }

  /**
   * Get predictive insights for upcoming week
   */
  async getWeeklyForecast(userId: string): Promise<{
    estimatedCompletions: number;
    atRiskTasks: number;
    recommendedDailyFocus: string[];
    capacityUtilization: number; // 0-100%
  }> {
    // Get current velocity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompletions = await db
      .select()
      .from(taskAnalytics)
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    const velocity = recentCompletions.length / 30;
    const estimatedCompletions = Math.round(velocity * 7);

    // Get tasks due this week
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const tasksThisWeek = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.archived, false),
          lte(tasks.dueDate, oneWeekFromNow.toISOString().split('T')[0]),
          sql`${tasks.status} != 'completed'`
        )
      );

    // Check risk for each task
    let atRiskCount = 0;
    for (const task of tasksThisWeek) {
      const risk = await this.assessTaskRisk(userId, task.id);
      if (
        risk &&
        (risk.riskLevel === 'high' || risk.riskLevel === 'critical')
      ) {
        atRiskCount++;
      }
    }

    // Generate daily focus recommendations
    const recommendedDailyFocus: string[] = [];
    const overdueToday = tasksThisWeek.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date()
    );
    const highPriority = tasksThisWeek
      .filter((t) => t.priorityScore === '1')
      .slice(0, 3);

    if (overdueToday.length > 0) {
      recommendedDailyFocus.push(
        `Complete ${overdueToday.length} overdue task(s)`
      );
    }
    if (highPriority.length > 0) {
      recommendedDailyFocus.push(
        `Focus on ${highPriority.length} high-priority task(s)`
      );
    }
    if (estimatedCompletions < tasksThisWeek.length) {
      recommendedDailyFocus.push(
        'Schedule extra time or defer lower-priority items'
      );
    }

    // Calculate capacity utilization
    const requiredCompletions = tasksThisWeek.length;
    const capacity = estimatedCompletions;
    const capacityUtilization =
      capacity > 0
        ? Math.min(100, (requiredCompletions / capacity) * 100)
        : 100;

    return {
      estimatedCompletions,
      atRiskTasks: atRiskCount,
      recommendedDailyFocus,
      capacityUtilization: Math.round(capacityUtilization),
    };
  }
}

// Singleton instance
export const predictiveEngine = new PredictiveEngine();
