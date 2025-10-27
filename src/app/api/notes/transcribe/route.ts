import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reference: https://platform.openai.com/docs/guides/speech-to-text
// API: https://platform.openai.com/docs/api-reference/audio/createTranscription

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

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const prompt = formData.get('prompt') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Check file size (25 MB limit from OpenAI)
    const maxSize = 25 * 1024 * 1024; // 25 MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        {
          error:
            'Audio file too large. Maximum size is 25 MB. Please record a shorter note.',
        },
        { status: 400 }
      );
    }

    // Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
    const validFormats = [
      'audio/mpeg',
      'audio/mp4',
      'audio/mpeg',
      'audio/mpga',
      'audio/m4a',
      'audio/wav',
      'audio/webm',
    ];
    if (
      !validFormats.includes(audioFile.type) &&
      !audioFile.name.match(/\.(mp3|mp4|mpeg|mpga|m4a|wav|webm)$/i)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid audio format. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm',
        },
        { status: 400 }
      );
    }

    // Transcribe using Whisper API
    // OpenAI SDK accepts File objects directly
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Can be auto-detected if not specified
      temperature: 0, // Deterministic results
      response_format: 'json',
      prompt: prompt || undefined, // Context hint for better accuracy
    });

    return NextResponse.json({
      transcript: transcription.text,
      language: 'en',
    });
  } catch (error: any) {
    console.error('Transcription error:', error);

    // Handle OpenAI-specific errors
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (error?.status === 413) {
      return NextResponse.json(
        { error: 'Audio file too large' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
