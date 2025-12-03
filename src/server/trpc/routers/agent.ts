import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { agentEngine } from '@/lib/ai/agent-engine';
import { db } from '@/server/db';
import { projects, tasks } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  executeCreateProject,
  executeUpdateProject,
  executeDeleteProject,
  executeSearchProjects,
  executeCreateTask,
  executeUpdateTask,
  executeDeleteTask,
  executeSearchTasks,
  executeChangeTaskStatus,
  executeGetTaskSummary,
  executeCreateNote,
  executeUpdateNote,
  executeDeleteNote,
  executeSearchNotes,
  executeGetProjectStats,
  executeGenerateReport,
} from '@/lib/ai/agent-actions';

// Map function names to executors
const ACTION_EXECUTORS: Record<string, Function> = {
  createProject: executeCreateProject,
  updateProject: executeUpdateProject,
  deleteProject: executeDeleteProject,
  searchProjects: executeSearchProjects,
  createTask: executeCreateTask,
  updateTask: executeUpdateTask,
  deleteTask: executeDeleteTask,
  searchTasks: executeSearchTasks,
  changeTaskStatus: executeChangeTaskStatus,
  getTaskSummary: executeGetTaskSummary,
  createNote: executeCreateNote,
  updateNote: executeUpdateNote,
  deleteNote: executeDeleteNote,
  searchNotes: executeSearchNotes,
  getProjectStats: executeGetProjectStats,
  generateReport: executeGenerateReport,
};

export const agentRouter = createTRPCRouter({
  // Execute a natural language command
  executeCommand: protectedProcedure
    .input(
      z.object({
        command: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user context (recent projects and tasks)
        const userProjects = await db
          .select({ id: projects.id, name: projects.name })
          .from(projects)
          .where(eq(projects.userId, ctx.session.user.id))
          .orderBy(desc(projects.updatedAt))
          .limit(10);

        const recentTasks = await db
          .select({ id: tasks.id, title: tasks.title })
          .from(tasks)
          .where(eq(tasks.userId, ctx.session.user.id))
          .orderBy(desc(tasks.updatedAt))
          .limit(10);

        // Parse command using AI
        const { intent, actions, needsApproval } =
          await agentEngine.parseCommand(ctx.session.user.id, input.command, {
            projects: userProjects,
            recentTasks: recentTasks,
          });

        if (actions.length === 0) {
          return {
            type: 'response' as const,
            message:
              intent || 'I understood your request but no actions are needed.',
          };
        }

        // If needs approval, return actions for user confirmation
        if (needsApproval) {
          return {
            type: 'approval_needed' as const,
            intent,
            actions: actions.map((action) => ({
              id: action.id,
              function: action.function,
              parameters: action.parameters,
              description: action.description,
              impact: action.impact,
            })),
          };
        }

        // Execute simple actions immediately
        const results = [];
        for (const action of actions) {
          const executor = ACTION_EXECUTORS[action.function];
          if (!executor) {
            results.push({
              actionId: action.id,
              success: false,
              error: `Unknown action: ${action.function}`,
            });
            continue;
          }

          const result = await agentEngine.executeWithRetry(() =>
            executor({
              userId: ctx.session.user.id,
              ...action.parameters,
            })
          );

          results.push({
            actionId: action.id,
            function: action.function,
            ...result,
          });
        }

        return {
          type: 'execution' as const,
          intent,
          results,
        };
      } catch (error: any) {
        console.error('[AgentRouter] Execute command error:', error);
        return {
          type: 'error' as const,
          error: error.message || 'Failed to execute command',
        };
      }
    }),

  // Approve and execute pending actions
  approveActions: protectedProcedure
    .input(
      z.object({
        actions: z.array(
          z.object({
            id: z.string(),
            function: z.string(),
            parameters: z.record(z.any()),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const results = [];

        for (const action of input.actions) {
          const executor = ACTION_EXECUTORS[action.function];
          if (!executor) {
            results.push({
              actionId: action.id,
              success: false,
              error: `Unknown action: ${action.function}`,
            });
            continue;
          }

          const result = await agentEngine.executeWithRetry(() =>
            executor({
              userId: ctx.session.user.id,
              ...action.parameters,
            })
          );

          results.push({
            actionId: action.id,
            function: action.function,
            ...result,
          });
        }

        return {
          success: true,
          results,
        };
      } catch (error: any) {
        console.error('[AgentRouter] Approve actions error:', error);
        return {
          success: false,
          error: error.message || 'Failed to execute approved actions',
        };
      }
    }),

  // Get list of available agent capabilities
  getCapabilities: protectedProcedure.query(async () => {
    return {
      capabilities: agentEngine.getCapabilities(),
      examples: [
        'Create a new project called "Website Redesign"',
        'Add a task to implement login page',
        'Show me all overdue tasks',
        'What are my top priority items?',
        'Mark task X as completed',
        'Create a note about the client meeting',
        'Get statistics for project Y',
      ],
    };
  }),

  // Health check for agent system
  healthCheck: protectedProcedure.query(async () => {
    const isHealthy = await agentEngine.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }),
});
