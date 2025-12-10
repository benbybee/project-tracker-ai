import { z } from 'zod';

/**
 * AI Tool definitions for Pattern 4 Sprint System
 * These are used by the AI chat agent to understand available capabilities
 */

export const pattern4Tools = [
  {
    name: 'create_sprint_plan',
    description: 'Create a new 90-day sprint plan with initial weeks and opportunities.',
    parameters: z.object({
      name: z.string().describe('Name of the sprint (e.g., "Q1 Growth Sprint")'),
      startDate: z.string().describe('Start date in YYYY-MM-DD format'),
      goalSummary: z.string().describe('Main goal or theme for the sprint'),
      weeks: z.array(z.object({
        weekIndex: z.number(),
        theme: z.string().optional(),
        notes: z.string().optional(),
      })).optional().describe('Optional list of week themes'),
      opportunities: z.array(z.object({
        name: z.string(),
        type: z.enum(['MAJOR', 'MICRO']),
        summary: z.string().optional(),
        estimatedCost: z.string().optional(),
      })).optional().describe('Optional list of initial opportunities'),
    }),
  },
  {
    name: 'rebalance_week',
    description: 'Move tasks between weeks or adjust priorities within a week.',
    parameters: z.object({
      weekIndex: z.number().describe('The week number to rebalance (1-13)'),
      action: z.enum(['push_tasks', 'pull_tasks', 'reprioritize']).describe('Type of rebalancing action'),
      taskIds: z.array(z.string()).optional().describe('Specific task IDs to move'),
      targetWeekIndex: z.number().optional().describe('Target week to move tasks to'),
      reason: z.string().describe('Reason for the rebalance'),
    }),
  },
  {
    name: 'analyze_opportunity',
    description: 'Analyze an opportunity for viability, risks, and resource requirements.',
    parameters: z.object({
      opportunityId: z.string().describe('ID of the opportunity to analyze'),
      aspects: z.array(z.enum(['viability', 'risks', 'resources', 'roi'])).optional(),
    }),
  },
  {
    name: 'move_tasks',
    description: 'Bulk move tasks between sprint weeks or opportunities.',
    parameters: z.object({
      taskIds: z.array(z.string()).describe('List of task IDs to move'),
      targetSprintWeekId: z.string().optional().describe('Target week ID'),
      targetOpportunityId: z.string().optional().describe('Target opportunity ID'),
    }),
  },
  {
    name: 'suggest_priorities',
    description: 'Suggest task prioritization based on opportunity value and deadlines.',
    parameters: z.object({
      sprintId: z.string().describe('ID of the active sprint'),
      focusArea: z.string().optional().describe('Specific area to focus on (e.g., "revenue", "speed")'),
    }),
  },
];

export type Pattern4ToolName = 
  | 'create_sprint_plan' 
  | 'rebalance_week' 
  | 'analyze_opportunity' 
  | 'move_tasks'
  | 'suggest_priorities';

export interface AIProposal {
  action: Pattern4ToolName;
  summary: string;
  changes: Array<{
    type: 'sprint' | 'week' | 'opportunity' | 'task';
    action: 'create' | 'update' | 'delete' | 'move';
    id?: string;
    data: any;
    description: string;
  }>;
  requiresConfirmation: boolean;
}

