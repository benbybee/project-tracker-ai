import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { db } from '@/server/db';
import { plaudPending } from '@/server/db/schema';
import { fetchPlaudAudio, downloadAudioBlob } from '@/lib/plaud-import';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'sk-dummy-key') {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if OpenAI API key is configured
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === 'sk-dummy-key'
    ) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { shareUrl, projectId } = body;

    if (!shareUrl || typeof shareUrl !== 'string') {
      return NextResponse.json(
        { error: 'Share URL is required' },
        { status: 400 }
      );
    }

    // Step 1: Fetch audio data from Plaud share link
    let audioData;
    try {
      audioData = await fetchPlaudAudio(shareUrl);
    } catch (error: any) {
      console.error('Failed to fetch Plaud audio:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch audio from Plaud link' },
        { status: 400 }
      );
    }

    // Step 2: Download audio file
    let audioBlob;
    try {
      audioBlob = await downloadAudioBlob(audioData.audioUrl);
    } catch (error: any) {
      console.error('Failed to download audio:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to download audio file' },
        { status: 400 }
      );
    }

    // Convert Blob to File for OpenAI API
    const audioFile = new File([audioBlob], 'plaud-recording.mp3', {
      type: audioBlob.type || 'audio/mpeg',
    });

    // Step 3: Transcribe using OpenAI Whisper
    let transcript = '';
    try {
      const transcription = await getOpenAIClient().audio.transcriptions.create(
        {
          file: audioFile,
          model: 'whisper-1',
          language: 'en',
          temperature: 0,
          response_format: 'json',
          prompt: audioData.title
            ? `Recording about: ${audioData.title}`
            : undefined,
        }
      );
      transcript = transcription.text;
    } catch (error: any) {
      console.error('Transcription error:', error);
      return NextResponse.json(
        { error: 'Failed to transcribe audio. Please try again.' },
        { status: 500 }
      );
    }

    // Step 4: Generate AI summary and extract tasks
    let aiSummary = '';
    let aiTasks: any[] = [];

    try {
      const openai = getOpenAIClient();

      const prompt = `You are an AI assistant helping to analyze audio transcripts and generate actionable tasks.

TRANSCRIPT:
Title: ${audioData.title || 'Untitled Recording'}
Content: ${transcript}

Generate 3-7 specific, actionable tasks from this transcript.
For each task provide:
- Clear title (concise, action-oriented)
- Detailed description (what needs to be done, any context)
- Confidence score (0-100) indicating how certain you are this is a valid task

Format your response as JSON:
{
  "summary": "Brief analysis of the transcript and key points...",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "confidence": 85
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert project manager and task extraction specialist. Analyze transcripts and extract clear, actionable tasks with realistic confidence scores.',
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
      // Fallback: create basic tasks from transcript
      aiSummary = `Recording: ${audioData.title || 'Untitled'}\n\nTranscript:\n${transcript.slice(0, 500)}${transcript.length > 500 ? '...' : ''}`;
      aiTasks = [
        {
          title: `Review: ${audioData.title || 'Audio Recording'}`,
          description: 'Review and process the recorded audio transcript',
          confidence: 70,
        },
        {
          title: 'Follow up on action items',
          description: 'Identify and complete action items from the recording',
          confidence: 60,
        },
      ];
    }

    // Step 5: Get project name if projectId is provided
    let suggestedProjectName: string | null = null;
    if (projectId) {
      try {
        const projectResult = await db.query.projects.findFirst({
          where: (projects, { eq }) => eq(projects.id, projectId),
          columns: { name: true },
        });
        suggestedProjectName = projectResult?.name || null;
      } catch (error) {
        console.error('Failed to fetch project name:', error);
      }
    }

    // Step 6: Insert tasks into plaud_pending table
    const insertedTasks = [];

    for (const task of aiTasks) {
      const [inserted] = await db
        .insert(plaudPending)
        .values({
          title: task.title,
          description: task.description || aiSummary,
          confidence: task.confidence || null,
          sourceId: shareUrl,
          suggestedProjectName: suggestedProjectName,
        })
        .returning();

      insertedTasks.push(inserted);
    }

    return NextResponse.json({
      success: true,
      tasksCreated: insertedTasks.length,
      summary: aiSummary,
      transcript: transcript,
      title: audioData.title,
      tasks: insertedTasks,
    });
  } catch (error: any) {
    console.error('Import link error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import Plaud link' },
      { status: 500 }
    );
  }
}
