import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { notes, projects } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await req.json();

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Fetch note with project details
    const [noteData] = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        projectId: notes.projectId,
        projectName: projects.name,
        userId: notes.userId,
      })
      .from(notes)
      .leftJoin(projects, eq(notes.projectId, projects.id))
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!noteData) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify user owns the note
    if (noteData.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate AI summary and tasks using OpenAI
    let aiSummary = '';
    let aiTasks = [];

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `You are an AI assistant helping to analyze project notes and generate actionable tasks.

NOTE:
Title: ${noteData.title}
Content: ${noteData.content}
Project: ${noteData.projectName}

Generate 3-5 specific, actionable tasks from this note.
For each task provide:
- Clear title (concise, action-oriented)
- Detailed description (what needs to be done, any context)
- Realistic time estimate in hours

Format your response as JSON:
{
  "summary": "Brief analysis of the note and recommended approach...",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "estimatedHours": 4
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert project manager and task breakdown specialist. Analyze notes and break them down into clear, actionable development tasks with realistic time estimates.',
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
      aiSummary = `Task Analysis for: ${noteData.title}\n\nProject: ${noteData.projectName}\n\nNote Content Summary:\n${noteData.content.slice(0, 300)}${noteData.content.length > 300 ? '...' : ''}`;

      // Generate basic tasks from note
      aiTasks = [
        {
          title: `Review: ${noteData.title}`,
          description: `Review and plan implementation based on note content`,
          estimatedHours: 2,
        },
        {
          title: `Implementation Work`,
          description: `Implement the requirements outlined in the note`,
          estimatedHours: 8,
        },
        {
          title: 'Testing & QA',
          description: `Test and verify all changes are working correctly`,
          estimatedHours: 2,
        },
      ];
    }

    // Map AI tasks to our format
    const tasks = aiTasks.map((task: any) => ({
      id: randomUUID(),
      title: task.title,
      description: task.description,
      projectId: noteData.projectId,
      estimatedHours: task.estimatedHours || 4,
    }));

    return NextResponse.json({
      summary: aiSummary,
      tasks,
      projectId: noteData.projectId,
      projectName: noteData.projectName,
    });
  } catch (error) {
    console.error('Failed to generate tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}
