import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for agent features'
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Agent action result types
export interface AgentActionResult {
  success: boolean;
  data?: any;
  error?: string;
  retries?: number;
}

export interface AgentExecution {
  id: string;
  command: string;
  intent: string;
  actions: AgentAction[];
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'needs_approval';
  results?: AgentActionResult[];
  error?: string;
}

export interface AgentAction {
  id: string;
  type: 'simple' | 'complex';
  function: string;
  parameters: Record<string, any>;
  description: string;
  impact?: string;
}

// OpenAI function schemas for agent capabilities
const AGENT_FUNCTIONS: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[] =
  [
    {
      name: 'createProject',
      description: 'Create a new project in the system',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the project',
          },
          type: {
            type: 'string',
            enum: ['general', 'website'],
            description: 'Type of project - general or website',
          },
          description: {
            type: 'string',
            description: 'Optional project description',
          },
          domain: {
            type: 'string',
            description: 'Domain name for website projects',
          },
        },
        required: ['name', 'type'],
      },
    },
    {
      name: 'createTask',
      description: 'Create a new task in a project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'ID of the project to add the task to',
          },
          projectName: {
            type: 'string',
            description:
              'Name of the project (will be used to look up ID if projectId not provided)',
          },
          title: {
            type: 'string',
            description: 'Title of the task',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the task',
          },
          priorityScore: {
            type: 'string',
            enum: ['1', '2', '3', '4'],
            description: 'Priority: 1=low, 2=medium, 3=high, 4=urgent',
          },
          dueDate: {
            type: 'string',
            description: 'Due date in YYYY-MM-DD format',
          },
        },
        required: ['title'],
      },
    },
    {
      name: 'updateTask',
      description: 'Update an existing task',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of the task to update',
          },
          title: {
            type: 'string',
            description: 'New title',
          },
          description: {
            type: 'string',
            description: 'New description',
          },
          status: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'blocked', 'completed'],
            description: 'Task status',
          },
          priorityScore: {
            type: 'string',
            enum: ['1', '2', '3', '4'],
          },
          dueDate: {
            type: 'string',
            description: 'Due date in YYYY-MM-DD format',
          },
        },
        required: ['taskId'],
      },
    },
    {
      name: 'deleteTask',
      description: 'Delete a task (requires user approval)',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of the task to delete',
          },
        },
        required: ['taskId'],
      },
    },
    {
      name: 'deleteProject',
      description:
        'Delete a project and all its tasks (requires user approval)',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'ID of the project to delete',
          },
        },
        required: ['projectId'],
      },
    },
    {
      name: 'searchTasks',
      description: 'Search for tasks using semantic search or filters',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          status: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'blocked', 'completed'],
            description: 'Filter by status',
          },
          projectId: {
            type: 'string',
            description: 'Filter by project ID',
          },
          overdue: {
            type: 'boolean',
            description: 'Show only overdue tasks',
          },
        },
      },
    },
    {
      name: 'searchProjects',
      description: 'Search for projects',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          type: {
            type: 'string',
            enum: ['general', 'website'],
            description: 'Filter by project type',
          },
        },
      },
    },
    {
      name: 'createNote',
      description: 'Create a note in a project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'ID of the project',
          },
          projectName: {
            type: 'string',
            description: 'Name of the project (if ID not known)',
          },
          title: {
            type: 'string',
            description: 'Note title',
          },
          content: {
            type: 'string',
            description: 'Note content',
          },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'getTaskSummary',
      description: 'Get a summary of tasks with various filters',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: [
              'not_started',
              'in_progress',
              'blocked',
              'completed',
              'overdue',
            ],
          },
          projectId: {
            type: 'string',
            description: 'Filter by project',
          },
          dueWithinDays: {
            type: 'number',
            description: 'Tasks due within N days',
          },
        },
      },
    },
    {
      name: 'getProjectStats',
      description: 'Get statistics for a specific project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'ID of the project',
          },
          projectName: {
            type: 'string',
            description: 'Name of the project (if ID not known)',
          },
        },
      },
    },
    {
      name: 'changeTaskStatus',
      description: 'Change the status of a task',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of the task',
          },
          status: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'blocked', 'completed'],
            description: 'New status',
          },
          blockedReason: {
            type: 'string',
            description: 'Reason if status is blocked',
          },
        },
        required: ['taskId', 'status'],
      },
    },
  ];

// Classify actions as simple or complex
function classifyAction(functionName: string): 'simple' | 'complex' {
  const complexActions = ['deleteTask', 'deleteProject', 'bulkUpdate'];
  return complexActions.includes(functionName) ? 'complex' : 'simple';
}

/**
 * AI Agent Engine powered by OpenAI Function Calling
 * Interprets natural language commands and executes actions
 */
export class AgentEngine {
  private requestCount: Map<string, number> = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;
  private readonly MAX_REQUESTS_PER_HOUR = 50;

  /**
   * Check if user has exceeded rate limit
   */
  checkRateLimit(userId: string): { allowed: boolean; error?: string } {
    const now = Date.now();
    const minuteKey = `${userId}-${Math.floor(now / 60000)}`;
    const hourKey = `${userId}-${Math.floor(now / 3600000)}`;

    const minuteCount = this.requestCount.get(minuteKey) || 0;
    const hourCount = this.requestCount.get(hourKey) || 0;

    if (minuteCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        error: 'Rate limit exceeded: Max 10 commands per minute',
      };
    }

    if (hourCount >= this.MAX_REQUESTS_PER_HOUR) {
      return {
        allowed: false,
        error: 'Rate limit exceeded: Max 50 commands per hour',
      };
    }

    this.requestCount.set(minuteKey, minuteCount + 1);
    this.requestCount.set(hourKey, hourCount + 1);

    return { allowed: true };
  }

  /**
   * Parse natural language command using OpenAI function calling
   */
  async parseCommand(
    userId: string,
    command: string,
    context?: {
      projects?: Array<{ id: string; name: string }>;
      recentTasks?: Array<{ id: string; title: string }>;
    }
  ): Promise<{
    intent: string;
    actions: AgentAction[];
    needsApproval: boolean;
  }> {
    const rateLimit = this.checkRateLimit(userId);
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.error);
    }

    const contextPrompt = context
      ? `
Current context:
${context.projects ? `Available projects: ${context.projects.map((p) => `${p.name} (${p.id})`).join(', ')}` : ''}
${context.recentTasks ? `Recent tasks: ${context.recentTasks.map((t) => `${t.title} (${t.id})`).join(', ')}` : ''}
`
      : '';

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an AI agent that helps users manage their tasks and projects. Parse the user's command and determine which function(s) to call. You can call multiple functions if needed.
            
${contextPrompt}

When a user refers to a project or task by name, use the context to find the ID. If multiple actions are needed, return them in logical order.`,
          },
          {
            role: 'user',
            content: command,
          },
        ],
        functions: AGENT_FUNCTIONS,
        function_call: 'auto',
        temperature: 0.3,
      });

      const responseMessage = completion.choices[0]?.message;

      if (!responseMessage) {
        throw new Error('No response from AI');
      }

      // Extract function calls
      const actions: AgentAction[] = [];
      let needsApproval = false;

      if (responseMessage.function_call) {
        const functionName = responseMessage.function_call.name;
        const parameters = JSON.parse(responseMessage.function_call.arguments);
        const actionType = classifyAction(functionName);

        if (actionType === 'complex') {
          needsApproval = true;
        }

        actions.push({
          id: `action-${Date.now()}`,
          type: actionType,
          function: functionName,
          parameters,
          description: `${functionName} with ${JSON.stringify(parameters)}`,
          impact:
            actionType === 'complex'
              ? 'This action cannot be undone'
              : undefined,
        });
      }

      return {
        intent: responseMessage.content || command,
        actions,
        needsApproval,
      };
    } catch (error: any) {
      console.error('[AgentEngine] Error parsing command:', error);
      throw new Error(`Failed to parse command: ${error.message}`);
    }
  }

  /**
   * Execute action with retry logic
   */
  async executeWithRetry<T>(
    action: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<AgentActionResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await action();
        return { success: true, data: result };
      } catch (error: any) {
        console.error(
          `[AgentEngine] Execution attempt ${attempt} failed:`,
          error
        );

        // Check if error is retriable
        const isRetriable =
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNRESET' ||
          error.status === 429 ||
          error.status === 503;

        if (!isRetriable || attempt === maxRetries) {
          return {
            success: false,
            error: error.message || 'Unknown error',
            retries: attempt,
          };
        }

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      retries: maxRetries,
    };
  }

  /**
   * Get list of available agent capabilities
   */
  getCapabilities(): Array<{
    name: string;
    description: string;
    parameters: string[];
  }> {
    return AGENT_FUNCTIONS.map((fn) => ({
      name: fn.name,
      description: fn.description || '',
      parameters: Object.keys(fn.parameters?.properties || {}),
    }));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10,
      });
      return completion.choices[0]?.message?.content?.includes('OK') || false;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const agentEngine = new AgentEngine();
