import { z } from 'zod';

/**
 * AI Tool definitions for Pattern 4 Sprint System
 * These are used by OpenAI to understand available operations
 */

export const pattern4Tools = {
  create_sprint_plan: {
    name: 'create_sprint_plan',
    description:
      'Generate a 90-day sprint plan with 13 weeks and initial opportunities.',
    parameters: z.object({
      name: z.string().describe('Name of the sprint (e.g., "Q1 2024 Growth")'),
      goalSummary: z.string().describe('Main goal or theme for this sprint'),
      startDate: z.string().describe('Start date (YYYY-MM-DD)'),
      opportunities: z
        .array(
          z.object({
            name: z.string(),
            type: z.enum(['MAJOR', 'MICRO']),
            summary: z.string(),
            estimatedCost: z.number().optional(),
            priority: z.number().min(1).max(4),
          })
        )
        .describe('List of initial opportunities to create'),
    }),
  },

  rebalance_week: {
    name: 'rebalance_week',
    description:
      'Adjust task distribution within a week or move tasks to other weeks.',
    parameters: z.object({
      weekId: z.string().uuid(),
      action: z.enum(['PUSH_FORWARD', 'PULL_BACK', 'PRIORITIZE']),
      targetTasks: z
        .array(z.string().uuid())
        .optional()
        .describe('Specific task IDs to move'),
      reason: z.string().describe('Reason for the rebalance'),
    }),
  },

  analyze_opportunity: {
    name: 'analyze_opportunity',
    description:
      'Assess an opportunity for viability, risks, and potential impact.',
    parameters: z.object({
      opportunityId: z.string().uuid(),
      analysisType: z.enum(['VIABILITY', 'RISK', 'ROI', 'FULL']),
    }),
  },

  move_tasks: {
    name: 'move_tasks',
    description: 'Move tasks between weeks or opportunities.',
    parameters: z.object({
      taskIds: z.array(z.string().uuid()),
      destinationType: z.enum(['WEEK', 'OPPORTUNITY']),
      destinationId: z.string().uuid(),
    }),
  },

  adjust_sprint_workload: {
    name: 'adjust_sprint_workload',
    description:
      'Redistribute workload across remaining weeks based on capacity.',
    parameters: z.object({
      sprintId: z.string().uuid(),
      capacityPerWeek: z.number().describe('Target number of tasks per week'),
      strategy: z.enum(['EVEN_DISTRIBUTION', 'FRONT_LOAD', 'BACK_LOAD']),
    }),
  },

  suggest_priorities: {
    name: 'suggest_priorities',
    description:
      'Recommend prioritization for tasks based on impact and urgency.',
    parameters: z.object({
      scope: z.enum(['SPRINT', 'WEEK', 'OPPORTUNITY']),
      scopeId: z.string().uuid(),
    }),
  },
};

export type Pattern4ToolName = keyof typeof pattern4Tools;
