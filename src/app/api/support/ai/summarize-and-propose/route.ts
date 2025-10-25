import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { tickets, projects } from '@/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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
        count: sql<number>`count(*)`.as('count')
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
        reason: 'Based on your previous ticket history'
      };
    }
    // 2. Check if domain matches any existing project
    else if (ticket.domain) {
      const domainMatch = allProjects.find(p => 
        p.name.toLowerCase().includes(ticket.domain!.toLowerCase()) ||
        ticket.domain!.toLowerCase().includes(p.name.toLowerCase())
      );
      if (domainMatch) {
        suggestedProject = {
          id: domainMatch.id,
          name: domainMatch.name,
          reason: 'Based on domain similarity'
        };
      }
    }
    // 3. Check if project name matches existing project
    else {
      const nameMatch = allProjects.find(p => 
        p.name.toLowerCase().includes(ticket.projectName.toLowerCase()) ||
        ticket.projectName.toLowerCase().includes(p.name.toLowerCase())
      );
      if (nameMatch) {
        suggestedProject = {
          id: nameMatch.id,
          name: nameMatch.name,
          reason: 'Based on project name similarity'
        };
      }
    }

    // Generate AI summary and tasks
    const summary = `AI Analysis for ${ticket.customerName} (${ticket.customerEmail}):\n\n` +
      `Project: ${ticket.projectName}\n` +
      `Priority: ${ticket.priority}\n` +
      `Domain: ${ticket.domain || 'Not specified'}\n\n` +
      `Request Summary: ${ticket.details.slice(0, 200)}${ticket.details.length > 200 ? '...' : ''}\n\n` +
      `Suggested Project: ${suggestedProject ? suggestedProject.name : 'No suggestion - manual assignment required'}\n` +
      `Reason: ${suggestedProject ? suggestedProject.reason : 'No historical data or domain match found'}`;

    // Generate contextual tasks based on ticket content
    const tasks = [];
    
    // Always include initial review task
    tasks.push({
      id: randomUUID(),
      title: `Initial Review: ${ticket.projectName}`,
      description: `Review requirements with ${ticket.customerName} and clarify scope`,
      projectId: suggestedProject?.id,
      estimatedHours: 2
    });

    // Add domain-specific tasks based on keywords
    const details = ticket.details.toLowerCase();
    if (details.includes('contact') || details.includes('form')) {
      tasks.push({
        id: randomUUID(),
        title: 'Contact Form Implementation',
        description: 'Add contact form functionality and validation',
        projectId: suggestedProject?.id,
        estimatedHours: 4
      });
    }
    if (details.includes('hero') || details.includes('homepage')) {
      tasks.push({
        id: randomUUID(),
        title: 'Homepage Hero Section Update',
        description: 'Update hero section design and content',
        projectId: suggestedProject?.id,
        estimatedHours: 3
      });
    }
    if (details.includes('mobile') || details.includes('responsive')) {
      tasks.push({
        id: randomUUID(),
        title: 'Mobile Responsiveness',
        description: 'Ensure mobile-friendly design and functionality',
        projectId: suggestedProject?.id,
        estimatedHours: 6
      });
    }
    if (details.includes('seo') || details.includes('search')) {
      tasks.push({
        id: randomUUID(),
        title: 'SEO Optimization',
        description: 'Improve search engine optimization',
        projectId: suggestedProject?.id,
        estimatedHours: 4
      });
    }

    // Add QA task if no specific tasks were generated
    if (tasks.length === 1) {
      tasks.push({
        id: randomUUID(),
        title: 'Development Work',
        description: `Implement requested changes: ${ticket.details.slice(0, 100)}...`,
        projectId: suggestedProject?.id,
        estimatedHours: 8
      });
    }

    // Always add QA task
    tasks.push({
      id: randomUUID(),
      title: 'QA & Client Review',
      description: `Test implementation and gather feedback from ${ticket.customerName}`,
      projectId: suggestedProject?.id,
      estimatedHours: 2
    });

    // Update ticket with AI summary and suggested project
    await db
      .update(tickets)
      .set({ 
        aiSummary: summary,
        suggestedProjectId: suggestedProject?.id,
        status: 'in_review',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return NextResponse.json({
      summary,
      tasks,
      suggestedProject,
      availableProjects: allProjects
    });
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI summary' },
      { status: 500 }
    );
  }
}

