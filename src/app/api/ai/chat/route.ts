import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import OpenAI from 'openai';
import { db } from '@/server/db';
import {
  taskAnalytics,
  tasks,
  projects,
  roles,
  aiChatSessions,
  aiChatMessages,
} from '@/server/db/schema';
import { eq, and, gte, sql, ilike, or } from 'drizzle-orm';
import { patternAnalyzer } from '@/lib/ai/pattern-analyzer';
import { predictiveEngine } from '@/lib/ai/predictive-engine';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
};

interface ChatContext {
  mode?: 'analytics' | 'project' | 'general';
  projectId?: string;
  projectName?: string;
}

// Tool definitions for OpenAI function calling
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Create a new project in the system',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Project name (minimum 2 characters)',
          },
          type: {
            type: 'string',
            enum: ['general', 'website'],
            description: 'Project type: general or website',
          },
          description: {
            type: 'string',
            description: 'Project description (optional)',
          },
          roleName: {
            type: 'string',
            description:
              'Name of the role to assign (optional, will be looked up)',
          },
          domain: {
            type: 'string',
            description: 'Website domain (optional, for website projects)',
          },
        },
        required: ['name', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project',
      description: 'Update an existing project',
      parameters: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'Name of the project to update (will be matched)',
          },
          name: {
            type: 'string',
            description: 'New name for the project (optional)',
          },
          description: {
            type: 'string',
            description: 'New description (optional)',
          },
          domain: {
            type: 'string',
            description: 'Website domain (optional)',
          },
          pinned: {
            type: 'boolean',
            description: 'Pin/unpin the project (optional)',
          },
        },
        required: ['projectName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_project',
      description: 'Delete a project from the system',
      parameters: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'Name of the project to delete (will be matched)',
          },
        },
        required: ['projectName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task in a project',
      parameters: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description:
              'Name of the project to create task in (will be matched)',
          },
          title: {
            type: 'string',
            description: 'Task title (minimum 2 characters)',
          },
          description: {
            type: 'string',
            description: 'Task description (optional)',
          },
          dueDate: {
            type: 'string',
            description: 'Due date in YYYY-MM-DD format (optional)',
          },
          priorityScore: {
            type: 'string',
            enum: ['1', '2', '3', '4'],
            description:
              'Priority: 1=low, 2=medium, 3=high, 4=urgent (default: 2)',
          },
          status: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'blocked', 'completed'],
            description: 'Task status (default: not_started)',
          },
        },
        required: ['projectName', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update an existing task',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: {
            type: 'string',
            description: 'Title of the task to update (will be matched)',
          },
          projectName: {
            type: 'string',
            description:
              'Project name for context (optional, helps with disambiguation)',
          },
          title: {
            type: 'string',
            description: 'New title (optional)',
          },
          description: {
            type: 'string',
            description: 'New description (optional)',
          },
          dueDate: {
            type: 'string',
            description: 'New due date in YYYY-MM-DD format (optional)',
          },
          priorityScore: {
            type: 'string',
            enum: ['1', '2', '3', '4'],
            description: 'New priority (optional)',
          },
          status: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'blocked', 'completed'],
            description: 'New status (optional)',
          },
        },
        required: ['taskTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Delete a task',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: {
            type: 'string',
            description: 'Title of the task to delete (will be matched)',
          },
          projectName: {
            type: 'string',
            description:
              'Project name for context (optional, helps with disambiguation)',
          },
        },
        required: ['taskTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_role',
      description: 'Create a new role/category',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Role name',
          },
          color: {
            type: 'string',
            description: 'Color hex code (e.g., #3B82F6)',
          },
        },
        required: ['name', 'color'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_role',
      description: 'Update an existing role',
      parameters: {
        type: 'object',
        properties: {
          roleName: {
            type: 'string',
            description: 'Name of the role to update (will be matched)',
          },
          name: {
            type: 'string',
            description: 'New name (optional)',
          },
          color: {
            type: 'string',
            description: 'New color hex code (optional)',
          },
        },
        required: ['roleName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_role',
      description: 'Delete a role',
      parameters: {
        type: 'object',
        properties: {
          roleName: {
            type: 'string',
            description: 'Name of the role to delete (will be matched)',
          },
        },
        required: ['roleName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: 'List all projects, optionally filtered',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['general', 'website'],
            description: 'Filter by project type (optional)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List tasks, optionally filtered',
      parameters: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'Filter by project name (optional)',
          },
          status: {
            type: 'string',
            enum: ['not_started', 'in_progress', 'blocked', 'completed'],
            description: 'Filter by status (optional)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_roles',
      description: 'List all roles/categories',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

// Entity resolution functions for fuzzy matching by name
async function findProjectByName(userId: string, projectName: string) {
  const matches = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        or(
          ilike(projects.name, `%${projectName}%`),
          ilike(projects.name, projectName)
        )
      )
    )
    .limit(5);

  return matches;
}

async function findTaskByTitle(
  userId: string,
  taskTitle: string,
  projectName?: string
) {
  let conditions = [
    eq(tasks.userId, userId),
    eq(tasks.archived, false),
    or(ilike(tasks.title, `%${taskTitle}%`), ilike(tasks.title, taskTitle)),
  ];

  // If projectName provided, filter by it
  if (projectName) {
    const projectMatches = await findProjectByName(userId, projectName);
    if (projectMatches.length > 0) {
      conditions.push(eq(tasks.projectId, projectMatches[0].id));
    }
  }

  const matches = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .limit(5);

  return matches;
}

async function findRoleByName(userId: string, roleName: string) {
  const matches = await db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.userId, userId),
        or(ilike(roles.name, `%${roleName}%`), ilike(roles.name, roleName))
      )
    )
    .limit(5);

  return matches;
}

// Tool execution handlers
async function executeTool(
  toolName: string,
  args: any,
  userId: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  needsConfirmation?: boolean;
  confirmationData?: any;
}> {
  try {
    switch (toolName) {
      case 'list_projects': {
        const conditions = [eq(projects.userId, userId)];

        if (args.type) {
          conditions.push(eq(projects.type, args.type));
        }

        const projectList = await db
          .select()
          .from(projects)
          .where(and(...conditions))
          .limit(50);

        return {
          success: true,
          data: {
            projects: projectList.map((p) => ({
              id: p.id,
              name: p.name,
              type: p.type,
              description: p.description,
              pinned: p.pinned,
            })),
            count: projectList.length,
          },
        };
      }

      case 'list_tasks': {
        let conditions = [eq(tasks.userId, userId), eq(tasks.archived, false)];

        if (args.projectName) {
          const projectMatches = await findProjectByName(
            userId,
            args.projectName
          );
          if (projectMatches.length === 0) {
            return {
              success: false,
              error: `No project found matching "${args.projectName}"`,
            };
          }
          if (projectMatches.length > 1) {
            return {
              success: false,
              error: `Multiple projects match "${args.projectName}": ${projectMatches.map((p) => p.name).join(', ')}. Please be more specific.`,
            };
          }
          conditions.push(eq(tasks.projectId, projectMatches[0].id));
        }

        if (args.status) {
          conditions.push(eq(tasks.status, args.status));
        }

        const taskList = await db
          .select()
          .from(tasks)
          .where(and(...conditions))
          .limit(50);

        return {
          success: true,
          data: {
            tasks: taskList.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priorityScore,
              dueDate: t.dueDate,
            })),
            count: taskList.length,
          },
        };
      }

      case 'list_roles': {
        const roleList = await db
          .select()
          .from(roles)
          .where(eq(roles.userId, userId));

        return {
          success: true,
          data: {
            roles: roleList.map((r) => ({
              id: r.id,
              name: r.name,
              color: r.color,
            })),
            count: roleList.length,
          },
        };
      }

      case 'create_project': {
        // Resolve role if provided
        let roleId = null;
        if (args.roleName) {
          const roleMatches = await findRoleByName(userId, args.roleName);
          if (roleMatches.length === 0) {
            return {
              success: false,
              error: `No role found matching "${args.roleName}"`,
            };
          }
          if (roleMatches.length > 1) {
            return {
              success: false,
              error: `Multiple roles match "${args.roleName}": ${roleMatches.map((r) => r.name).join(', ')}. Please be more specific.`,
            };
          }
          roleId = roleMatches[0].id;
        }

        // Return data for confirmation
        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'create_project',
            details: {
              name: args.name,
              type: args.type,
              description: args.description || '',
              roleId,
              roleName: args.roleName || null,
              domain: args.domain || null,
            },
          },
        };
      }

      case 'update_project': {
        const projectMatches = await findProjectByName(
          userId,
          args.projectName
        );

        if (projectMatches.length === 0) {
          return {
            success: false,
            error: `No project found matching "${args.projectName}"`,
          };
        }

        if (projectMatches.length > 1) {
          return {
            success: false,
            error: `Multiple projects match "${args.projectName}": ${projectMatches.map((p) => p.name).join(', ')}. Please specify which one.`,
          };
        }

        const project = projectMatches[0];
        const updates: any = {};

        if (args.name) updates.name = args.name;
        if (args.description !== undefined)
          updates.description = args.description;
        if (args.domain !== undefined) updates.domain = args.domain;
        if (args.pinned !== undefined) updates.pinned = args.pinned;

        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'update_project',
            projectId: project.id,
            projectName: project.name,
            details: updates,
          },
        };
      }

      case 'delete_project': {
        const projectMatches = await findProjectByName(
          userId,
          args.projectName
        );

        if (projectMatches.length === 0) {
          return {
            success: false,
            error: `No project found matching "${args.projectName}"`,
          };
        }

        if (projectMatches.length > 1) {
          return {
            success: false,
            error: `Multiple projects match "${args.projectName}": ${projectMatches.map((p) => p.name).join(', ')}. Please specify which one.`,
          };
        }

        const project = projectMatches[0];

        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'delete_project',
            projectId: project.id,
            projectName: project.name,
            projectType: project.type,
          },
        };
      }

      case 'create_task': {
        const projectMatches = await findProjectByName(
          userId,
          args.projectName
        );

        if (projectMatches.length === 0) {
          return {
            success: false,
            error: `No project found matching "${args.projectName}"`,
          };
        }

        if (projectMatches.length > 1) {
          return {
            success: false,
            error: `Multiple projects match "${args.projectName}": ${projectMatches.map((p) => p.name).join(', ')}. Please specify which one.`,
          };
        }

        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'create_task',
            projectId: projectMatches[0].id,
            projectName: projectMatches[0].name,
            details: {
              title: args.title,
              description: args.description || '',
              dueDate: args.dueDate || null,
              priorityScore: args.priorityScore || '2',
              status: args.status || 'not_started',
            },
          },
        };
      }

      case 'update_task': {
        const taskMatches = await findTaskByTitle(
          userId,
          args.taskTitle,
          args.projectName
        );

        if (taskMatches.length === 0) {
          return {
            success: false,
            error: `No task found matching "${args.taskTitle}"`,
          };
        }

        if (taskMatches.length > 1) {
          return {
            success: false,
            error: `Multiple tasks match "${args.taskTitle}": ${taskMatches.map((t) => t.title).join(', ')}. Please be more specific or provide the project name.`,
          };
        }

        const task = taskMatches[0];
        const updates: any = {};

        if (args.title) updates.title = args.title;
        if (args.description !== undefined)
          updates.description = args.description;
        if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
        if (args.priorityScore) updates.priorityScore = args.priorityScore;
        if (args.status) updates.status = args.status;

        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'update_task',
            taskId: task.id,
            taskTitle: task.title,
            details: updates,
          },
        };
      }

      case 'delete_task': {
        const taskMatches = await findTaskByTitle(
          userId,
          args.taskTitle,
          args.projectName
        );

        if (taskMatches.length === 0) {
          return {
            success: false,
            error: `No task found matching "${args.taskTitle}"`,
          };
        }

        if (taskMatches.length > 1) {
          return {
            success: false,
            error: `Multiple tasks match "${args.taskTitle}": ${taskMatches.map((t) => t.title).join(', ')}. Please be more specific or provide the project name.`,
          };
        }

        const task = taskMatches[0];

        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'delete_task',
            taskId: task.id,
            taskTitle: task.title,
          },
        };
      }

      case 'create_role': {
        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'create_role',
            details: {
              name: args.name,
              color: args.color,
            },
          },
        };
      }

      case 'update_role': {
        const roleMatches = await findRoleByName(userId, args.roleName);

        if (roleMatches.length === 0) {
          return {
            success: false,
            error: `No role found matching "${args.roleName}"`,
          };
        }

        if (roleMatches.length > 1) {
          return {
            success: false,
            error: `Multiple roles match "${args.roleName}": ${roleMatches.map((r) => r.name).join(', ')}. Please specify which one.`,
          };
        }

        const role = roleMatches[0];
        const updates: any = {};

        if (args.name) updates.name = args.name;
        if (args.color) updates.color = args.color;

        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'update_role',
            roleId: role.id,
            roleName: role.name,
            details: updates,
          },
        };
      }

      case 'delete_role': {
        const roleMatches = await findRoleByName(userId, args.roleName);

        if (roleMatches.length === 0) {
          return {
            success: false,
            error: `No role found matching "${args.roleName}"`,
          };
        }

        if (roleMatches.length > 1) {
          return {
            success: false,
            error: `Multiple roles match "${args.roleName}": ${roleMatches.map((r) => r.name).join(', ')}. Please specify which one.`,
          };
        }

        const role = roleMatches[0];

        return {
          success: true,
          needsConfirmation: true,
          confirmationData: {
            action: 'delete_role',
            roleId: role.id,
            roleName: role.name,
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`[Tool Execution] Error in ${toolName}:`, error);
    return { success: false, error: error.message || 'Tool execution failed' };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context, history, sessionId, tags, originalMessage } =
      await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const chatContext: ChatContext = context || { mode: 'general' };

    // Handle session creation/retrieval
    let chatSessionId: string = sessionId || '';
    if (!chatSessionId) {
      // Create new session with title from original message or cleaned message
      const titleSource = originalMessage || message;
      const sessionTitle =
        titleSource.substring(0, 50) + (titleSource.length > 50 ? '...' : '');
      const [newSession] = await db
        .insert(aiChatSessions)
        .values({
          userId,
          title: sessionTitle,
        })
        .returning();
      chatSessionId = newSession.id;
    }

    // Save user message to database (use original message with tags)
    await db.insert(aiChatMessages).values({
      sessionId: chatSessionId,
      role: 'user',
      content: originalMessage || message,
    });

    console.log('[AI Unified Chat] Processing request:', {
      userId,
      mode: chatContext.mode,
      projectId: chatContext.projectId,
    });

    // Build system prompt based on context
    let systemPrompt = '';
    let contextData: any = {};

    if (chatContext.mode === 'analytics') {
      const analyticsData = await gatherAnalyticsContext(userId);
      contextData = analyticsData;
      systemPrompt = buildAnalyticsSystemPrompt(analyticsData);
    } else if (chatContext.mode === 'project' && chatContext.projectId) {
      const projectData = await gatherProjectContext(
        userId,
        chatContext.projectId
      );
      contextData = projectData;
      systemPrompt = buildProjectSystemPrompt(projectData);
    } else {
      const generalData = await gatherGeneralContext(userId);
      contextData = generalData;
      systemPrompt = buildGeneralSystemPrompt(generalData);
    }

    // Add tagged context if tags provided
    if (tags && Object.keys(tags).length > 0) {
      let tagContext =
        '\n\n--- TAGGED CONTEXT (User provided structured data) ---\n';

      if (tags.projects && tags.projects.length > 0) {
        // Look up project details
        const taggedProjects = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.userId, userId),
              sql`${projects.id} = ANY(${tags.projects})`
            )
          );

        if (taggedProjects.length > 0) {
          tagContext += `Projects: ${taggedProjects.map((p) => `@${p.name} (ID: ${p.id}, Type: ${p.type})`).join(', ')}\n`;
        }
      }

      if (tags.projectName) {
        tagContext += `New Project Name: /projectname "${tags.projectName}"\n`;
      }

      if (tags.task) {
        tagContext += `Task Title: /task "${tags.task}"\n`;
      }

      if (tags.userRole) {
        tagContext += `Role/Category: /userole "${tags.userRole}"\n`;
      }

      if (tags.priority) {
        const priorityMap: Record<string, string> = {
          low: '1 (Low)',
          medium: '2 (Medium)',
          high: '3 (High)',
          urgent: '4 (Urgent)',
        };
        tagContext += `Priority: /priority ${tags.priority} = priorityScore "${priorityMap[tags.priority] || tags.priority}"\n`;
      }

      if (tags.dueDate) {
        tagContext += `Due Date: /duedate ${tags.dueDate} (ISO format)\n`;
      }

      if (tags.status) {
        tagContext += `Status: /status ${tags.status}\n`;
      }

      if (tags.notes) {
        tagContext += `Notes/Description: /notes "${tags.notes}"\n`;
      }

      tagContext +=
        '\nIMPORTANT: The user has provided structured context above. Use this information when calling tools to avoid asking unnecessary follow-up questions. For example:\n';
      tagContext +=
        '- If @project is tagged, use that project ID/name directly\n';
      tagContext += '- If /task is provided, use that as the task title\n';
      tagContext +=
        '- If /priority is provided, use the corresponding priorityScore\n';
      tagContext += '- Pre-populate tool parameters with this data\n';
      tagContext += '--- END TAGGED CONTEXT ---\n';

      systemPrompt += tagContext;
    }

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        if (msg.role === 'tool') {
          messages.push({
            role: 'tool',
            content: msg.content,
            tool_call_id: msg.tool_call_id,
          });
        } else {
          messages.push({
            role: msg.role,
            content: msg.content || '',
          });
        }
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI with tools
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) {
      throw new Error('No response from AI');
    }

    // Check if AI wants to call tools
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      console.log('[AI Unified Chat] Tool call:', toolName, toolArgs);

      // Execute the tool
      const toolResult = await executeTool(toolName, toolArgs, userId);

      // If tool needs confirmation, return special response
      if (toolResult.needsConfirmation) {
        const confirmMessage = responseMessage.content || '';

        // Save assistant message requesting confirmation
        await db.insert(aiChatMessages).values({
          sessionId: chatSessionId,
          role: 'assistant',
          content: confirmMessage,
          metadata: {
            needsConfirmation: true,
            confirmationData: toolResult.confirmationData,
          },
        });

        // Update session's lastMessageAt
        await db
          .update(aiChatSessions)
          .set({ lastMessageAt: new Date() })
          .where(eq(aiChatSessions.id, chatSessionId));

        return NextResponse.json({
          message: confirmMessage,
          needsConfirmation: true,
          confirmationData: toolResult.confirmationData,
          context: contextData,
          toolCallId: toolCall.id,
          sessionId: chatSessionId,
        });
      }

      // If tool succeeded without confirmation (list operations), include result
      if (toolResult.success) {
        // Add tool response to conversation and get AI's interpretation
        messages.push({
          role: 'assistant',
          content: responseMessage.content,
          tool_calls: [toolCall],
        });

        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResult.data),
          tool_call_id: toolCall.id,
        });

        // Get AI's interpretation of the tool result
        const followUpCompletion =
          await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1000,
          });

        const finalResponse =
          followUpCompletion.choices[0]?.message?.content ||
          JSON.stringify(toolResult.data) ||
          'Operation completed successfully.';

        // Save assistant response to database
        await db.insert(aiChatMessages).values({
          sessionId: chatSessionId,
          role: 'assistant',
          content: finalResponse,
          metadata: { toolExecuted: toolName, toolResult: toolResult.data },
        });

        // Update session's lastMessageAt
        await db
          .update(aiChatSessions)
          .set({ lastMessageAt: new Date() })
          .where(eq(aiChatSessions.id, chatSessionId));

        return NextResponse.json({
          message: finalResponse,
          context: contextData,
          toolExecuted: toolName,
          sessionId: chatSessionId,
        });
      }

      // If tool failed, return error message
      if (!toolResult.success) {
        // Add tool error to conversation and let AI respond
        messages.push({
          role: 'assistant',
          content: responseMessage.content,
          tool_calls: [toolCall],
        });

        messages.push({
          role: 'tool',
          content: JSON.stringify({ error: toolResult.error }),
          tool_call_id: toolCall.id,
        });

        // Get AI's response to the error
        const errorCompletion = await getOpenAIClient().chat.completions.create(
          {
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1000,
          }
        );

        const errorResponse =
          errorCompletion.choices[0]?.message?.content ||
          toolResult.error ||
          'An error occurred while processing your request.';

        // Save error response to database
        await db.insert(aiChatMessages).values({
          sessionId: chatSessionId,
          role: 'assistant',
          content: errorResponse,
          metadata: { toolError: true, error: toolResult.error },
        });

        // Update session's lastMessageAt
        await db
          .update(aiChatSessions)
          .set({ lastMessageAt: new Date() })
          .where(eq(aiChatSessions.id, chatSessionId));

        return NextResponse.json({
          message: errorResponse,
          context: contextData,
          toolError: true,
          sessionId: chatSessionId,
        });
      }
    }

    // No tool calls, return regular response
    const response = responseMessage.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    // Save assistant response to database
    await db.insert(aiChatMessages).values({
      sessionId: chatSessionId,
      role: 'assistant',
      content: response as string, // Type assertion safe due to check above
    });

    // Update session's lastMessageAt
    await db
      .update(aiChatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(aiChatSessions.id, chatSessionId));

    console.log('[AI Unified Chat] Request completed successfully');
    return NextResponse.json({
      message: response,
      context: contextData,
      sessionId: chatSessionId,
    });
  } catch (error: any) {
    console.error('[AI Unified Chat] Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: error.message || 'Failed to process request',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

async function gatherAnalyticsContext(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Completion stats
    const [completionStats] = await db
      .select({
        count: sql<number>`count(*)`,
        avgDuration: sql<number>`avg(${taskAnalytics.actualDurationMinutes})`,
      })
      .from(taskAnalytics)
      .where(
        and(
          eq(taskAnalytics.userId, userId),
          gte(taskAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    // Patterns
    const patterns = await patternAnalyzer.getStoredPatterns(userId);

    // Workload analysis
    const workloadAnalysis = await predictiveEngine.analyzeWorkload(userId);

    // Weekly forecast
    const weeklyForecast = await predictiveEngine.getWeeklyForecast(userId);

    // Task counts
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString();

    const [taskCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} IN ('in_progress', 'in-progress'))`,
        notStarted: sql<number>`count(*) filter (where ${tasks.status} IN ('not_started', 'not-completed'))`,
        blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`,
        overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
        dueToday: sql<number>`count(*) filter (where ${tasks.dueDate} = ${todayStr} and ${tasks.status} != 'completed')`,
        completedThisWeek: sql<number>`count(*) filter (where ${tasks.status} = 'completed' AND ${tasks.updatedAt} >= ${startOfWeekStr})`,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.archived, false)));

    // Project count
    const [projectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId));

    return {
      completionStats: {
        totalCompleted: Number(completionStats?.count || 0),
        avgDuration: Math.round(Number(completionStats?.avgDuration || 0)),
      },
      patterns: patterns
        ? {
            velocity: patterns.velocity.tasksPerDay.toFixed(1),
            trend: patterns.velocity.trend,
            productiveHours: patterns.productiveHours.join(', '),
          }
        : null,
      workload: {
        totalTasks: workloadAnalysis.totalTasks,
        estimatedHours: workloadAnalysis.totalEstimatedHours,
        daysToComplete: workloadAnalysis.daysToComplete,
        breakdown: workloadAnalysis.taskBreakdown,
      },
      forecast: {
        estimatedCompletions: weeklyForecast.estimatedCompletions,
        atRiskTasks: weeklyForecast.atRiskTasks,
        capacityUtilization: weeklyForecast.capacityUtilization,
      },
      taskCounts: {
        total: Number(taskCounts.total),
        completed: Number(taskCounts.completed),
        inProgress: Number(taskCounts.inProgress),
        notStarted: Number(taskCounts.notStarted),
        blocked: Number(taskCounts.blocked),
        overdue: Number(taskCounts.overdue),
        dueToday: Number(taskCounts.dueToday),
        completedThisWeek: Number(taskCounts.completedThisWeek),
      },
      projectCount: Number(projectCount.count),
    };
  } catch (error) {
    console.error('[Analytics Context] Error:', error);
    throw error;
  }
}

async function gatherProjectContext(userId: string, projectId: string) {
  try {
    // Fetch project details
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        type: projects.type,
      })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch project tasks
    const projectTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priorityScore,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .limit(50);

    // Calculate stats
    const taskStats = {
      total: projectTasks.length,
      completed: projectTasks.filter((t) => t.status === 'completed').length,
      inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
      blocked: projectTasks.filter((t) => t.status === 'blocked').length,
      notStarted: projectTasks.filter((t) => t.status === 'not_started').length,
    };

    const now = new Date();
    const overdue = projectTasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
      },
      taskStats,
      overdue,
      recentTasks: projectTasks.slice(0, 10),
    };
  } catch (error) {
    console.error('[Project Context] Error:', error);
    throw error;
  }
}

async function gatherGeneralContext(userId: string) {
  try {
    // Get high-level task counts
    const [taskCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} IN ('in_progress', 'in-progress'))`,
        blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`,
        overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < current_date and ${tasks.status} != 'completed')`,
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.archived, false)));

    // Get project list
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        type: projects.type,
      })
      .from(projects)
      .where(eq(projects.userId, userId))
      .limit(20);

    return {
      taskCounts: {
        total: Number(taskCounts.total),
        completed: Number(taskCounts.completed),
        inProgress: Number(taskCounts.inProgress),
        blocked: Number(taskCounts.blocked),
        overdue: Number(taskCounts.overdue),
      },
      projects: userProjects,
    };
  } catch (error) {
    console.error('[General Context] Error:', error);
    throw error;
  }
}

function buildAnalyticsSystemPrompt(data: any): string {
  return `You are an AI analytics assistant helping users understand their productivity data. You have access to the following analytics:

COMPLETION STATS (last 30 days):
- Total completed tasks: ${data.completionStats.totalCompleted}
- Average task duration: ${data.completionStats.avgDuration} minutes

${
  data.patterns
    ? `PRODUCTIVITY PATTERNS:
- Velocity: ${data.patterns.velocity} tasks/day
- Trend: ${data.patterns.trend}
- Most productive hours: ${data.patterns.productiveHours}`
    : 'PRODUCTIVITY PATTERNS: Not enough data yet'
}

CURRENT WORKLOAD:
- Total active tasks: ${data.workload.totalTasks}
- Estimated hours: ${data.workload.estimatedHours}
- Days to complete: ${data.workload.daysToComplete}
- Urgent: ${data.workload.breakdown.urgent}
- High priority: ${data.workload.breakdown.highPriority}
- Medium priority: ${data.workload.breakdown.mediumPriority}
- Low priority: ${data.workload.breakdown.lowPriority}

TASK STATUS:
- Total tasks: ${data.taskCounts.total}
- Completed: ${data.taskCounts.completed}
- In progress: ${data.taskCounts.inProgress}
- Not started: ${data.taskCounts.notStarted}
- Blocked: ${data.taskCounts.blocked}
- Overdue: ${data.taskCounts.overdue}
- Due today: ${data.taskCounts.dueToday}
- Completed this week: ${data.taskCounts.completedThisWeek}

WEEKLY FORECAST:
- Estimated completions: ${data.forecast.estimatedCompletions}
- At-risk tasks: ${data.forecast.atRiskTasks}
- Capacity utilization: ${data.forecast.capacityUtilization}%

PROJECTS: ${data.projectCount} total

AVAILABLE ACTIONS:
You can perform actions on behalf of the user using the available tools. When the user requests an action:
1. Gather any missing required information by asking follow-up questions
2. Use natural language references (project names, task titles, etc.) - you don't need IDs
3. Be conversational when gathering data ("What type of project?" instead of "type parameter required")
4. Once you have all required info, call the appropriate tool

Examples:
- "Create a project called Website Redesign" → Ask for type (general/website), then create
- "Update the Marketing project to add domain example.com" → Find project by name, then update
- "Delete the old task about documentation" → Find task by fuzzy title match, confirm, then delete

Provide helpful, actionable insights based on this data. Be conversational but precise. Use specific numbers from the data.`;
}

function buildProjectSystemPrompt(data: any): string {
  return `You are an AI project management assistant helping with the project "${data.project.name}".

Project Type: ${data.project.type}
Description: ${data.project.description || 'No description provided'}

Current Project Status:
- Total Tasks: ${data.taskStats.total}
- Completed: ${data.taskStats.completed} (${data.taskStats.total > 0 ? ((data.taskStats.completed / data.taskStats.total) * 100).toFixed(1) : 0}%)
- In Progress: ${data.taskStats.inProgress}
- Blocked: ${data.taskStats.blocked}
- Not Started: ${data.taskStats.notStarted}
- Overdue: ${data.overdue}

Recent Tasks:
${data.recentTasks
  .map(
    (t: any) =>
      `- [${t.status}] ${t.title} (Priority: ${t.priority}, Due: ${t.dueDate || 'No due date'})`
  )
  .join('\n')}

Your role is to:
1. Analyze the project health and provide insights
2. Suggest next tasks or improvements
3. Help identify and resolve blockers
4. Generate status updates
5. Answer questions about the project
6. Create, update, or manage tasks and projects when requested

AVAILABLE ACTIONS:
You can create, update, and delete tasks and projects. When the user requests an action:
- Gather missing information conversationally
- Use natural names (no IDs needed)
- Be helpful and proactive

Examples:
- "Add a task for updating the homepage" → Create task in this project
- "Mark the design task as completed" → Update task status
- "Delete the old meeting notes task" → Find and delete the task

Be concise, actionable, and helpful. Use data from the project context above.`;
}

function buildGeneralSystemPrompt(data: any): string {
  return `You are an AI productivity assistant with access to the user's complete task management system.

CURRENT STATUS:
- Total tasks: ${data.taskCounts.total}
- Completed: ${data.taskCounts.completed}
- In progress: ${data.taskCounts.inProgress}
- Blocked: ${data.taskCounts.blocked}
- Overdue: ${data.taskCounts.overdue}

PROJECTS (${data.projects.length} total):
${data.projects.map((p: any) => `- ${p.name} (${p.type})`).join('\n')}

CAPABILITIES:
- Analyze productivity and provide recommendations
- Help with task and project management
- Provide insights on workload and priorities
- Answer questions about tasks and projects
- Offer strategic advice on time management
- Create, update, and delete projects, tasks, and roles

TAKING ACTIONS:
When the user asks you to do something (create, update, delete):
1. Ask follow-up questions to gather any missing required information
2. Be conversational and helpful ("What type of project is this?" not "Missing type parameter")
3. Use the project/task/role names provided - you don't need IDs
4. Once you have all info, use the appropriate tool
5. The system will ask the user to confirm before executing

Examples:
- User: "Create a project for me" → You: "I'd be happy to create a project! What would you like to call it, and should it be a general project or a website project?"
- User: "Add a task to the Marketing project" → You: "What should the task be called?"
- User: "Update the homepage task to high priority" → Use update_task with taskTitle="homepage", priorityScore="3"
- User: "Delete the old project" → You: "Which project would you like to delete?" or use fuzzy match if clear from context

Be conversational, actionable, and data-driven. Help the user stay productive and organized.`;
}
