import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets, projects } from '@/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

// POST { ticketId } -> { summary, tasks: [{id,title,description,projectId?}], suggestedProject: {id,name} }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await req.json();

    // Fetch ticket details
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get historical project assignments for this customer
    const historicalProjects = await db
      .select({
        projectId: tickets.suggestedProjectId,
        projectName: projects.name,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(tickets)
      .leftJoin(projects, eq(tickets.suggestedProjectId, projects.id))
      .where(eq(tickets.customerEmail, ticket.customerEmail))
      .groupBy(tickets.suggestedProjectId, projects.name)
      .orderBy(desc(sql`count(*)`))
      .limit(3);

    // Get all available projects for manual assignment
    const allProjects = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .orderBy(projects.name);

    // AI-powered project suggestion logic
    let suggestedProject = null;

    // 1. Check if customer has historical project assignments
    if (historicalProjects.length > 0 && historicalProjects[0].projectId) {
      suggestedProject = {
        id: historicalProjects[0].projectId,
        name: historicalProjects[0].projectName,
        reason: 'Based on your previous ticket history',
      };
    }
    // 2. Check if domain matches any existing project
    else if (ticket.domain) {
      const domainMatch = allProjects.find(
        (p) =>
          p.name.toLowerCase().includes(ticket.domain!.toLowerCase()) ||
          ticket.domain!.toLowerCase().includes(p.name.toLowerCase())
      );
      if (domainMatch) {
        suggestedProject = {
          id: domainMatch.id,
          name: domainMatch.name,
          reason: 'Based on domain similarity',
        };
      }
    }
    // 3. Check if project name matches existing project
    else {
      const nameMatch = allProjects.find(
        (p) =>
          p.name.toLowerCase().includes(ticket.projectName.toLowerCase()) ||
          ticket.projectName.toLowerCase().includes(p.name.toLowerCase())
      );
      if (nameMatch) {
        suggestedProject = {
          id: nameMatch.id,
          name: nameMatch.name,
          reason: 'Based on project name similarity',
        };
      }
    }

    // Generate AI summary and tasks using OpenAI
    let aiSummary = '';
    let aiTasks = [];

    try {
      // Initialize OpenAI client inside the function
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `You are an AI assistant helping to analyze support tickets and generate actionable tasks.

TICKET DETAILS:
- Customer: ${ticket.customerName} (${ticket.customerEmail})
- Project: ${ticket.projectName}
- Domain: ${ticket.domain || 'Not specified'}
- Priority: ${ticket.priority}
- Request: ${ticket.details}

AVAILABLE PROJECTS:
${allProjects.map((p) => `- ${p.name} (ID: ${p.id})`).join('\n')}

HISTORICAL CONTEXT:
${
  historicalProjects.length > 0
    ? `This customer has previously worked on: ${historicalProjects.map((h) => h.projectName).join(', ')}`
    : 'No previous project history for this customer'
}

SUGGESTED PROJECT: ${suggestedProject ? `${suggestedProject.name} (${suggestedProject.reason})` : 'None - manual assignment needed'}

Please provide:
1. A concise summary of the ticket and recommended approach
2. 3-5 specific, actionable tasks with realistic time estimates
3. For each task, suggest which project it should be assigned to (use project names from the available list)

Format your response as JSON:
{
  "summary": "Brief analysis and approach...",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "estimatedHours": 4,
      "suggestedProject": "Project Name"
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert project manager and technical consultant. Analyze support tickets and break them down into actionable development tasks with realistic time estimates.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const aiResponse = JSON.parse(
        completion.choices[0].message.content || '{}'
      );
      aiSummary = aiResponse.summary || '';
      aiTasks = aiResponse.tasks || [];
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to rule-based approach
      aiSummary =
        `AI Analysis for ${ticket.customerName} (${ticket.customerEmail}):\n\n` +
        `Project: ${ticket.projectName}\n` +
        `Priority: ${ticket.priority}\n` +
        `Domain: ${ticket.domain || 'Not specified'}\n\n` +
        `Request Summary: ${ticket.details.slice(0, 200)}${ticket.details.length > 200 ? '...' : ''}\n\n` +
        `Suggested Project: ${suggestedProject ? suggestedProject.name : 'No suggestion - manual assignment required'}\n` +
        `Reason: ${suggestedProject ? suggestedProject.reason : 'No historical data or domain match found'}`;

      aiTasks = [
        {
          title: `Initial Review: ${ticket.projectName}`,
          description: `Review requirements with ${ticket.customerName} and clarify scope`,
          estimatedHours: 2,
          suggestedProject: suggestedProject?.name,
        },
        {
          title: 'Development Work',
          description: `Implement requested changes: ${ticket.details.slice(0, 100)}...`,
          estimatedHours: 8,
          suggestedProject: suggestedProject?.name,
        },
        {
          title: 'QA & Client Review',
          description: `Test implementation and gather feedback from ${ticket.customerName}`,
          estimatedHours: 2,
          suggestedProject: suggestedProject?.name,
        },
      ];
    }

    // Map AI tasks to our format and assign project IDs
    const tasks = aiTasks.map((task: any) => {
      const projectId = task.suggestedProject
        ? allProjects.find((p) => p.name === task.suggestedProject)?.id ||
          suggestedProject?.id
        : suggestedProject?.id;

      return {
        id: randomUUID(),
        title: task.title,
        description: task.description,
        projectId,
        estimatedHours: task.estimatedHours || 4,
      };
    });

    // Update ticket with AI summary and suggested project
    await db
      .update(tickets)
      .set({
        aiSummary: aiSummary,
        suggestedProjectId: suggestedProject?.id,
        status: 'in_review',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return NextResponse.json({
      summary: aiSummary,
      tasks,
      suggestedProject,
      availableProjects: allProjects,
    });
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI summary' },
      { status: 500 }
    );
  }
}
