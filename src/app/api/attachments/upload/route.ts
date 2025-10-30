/**
 * File Upload API Route
 * Handles file uploads to Vercel Blob storage for task attachments
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { put } from '@vercel/blob';
import { FILE_SIZE_LIMITS, validateFile, sanitizeFilename, isImage } from '@/lib/file-utils';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await req.formData();
    const taskId = form.get('taskId')?.toString();
    const file = form.get('file') as File | null;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check file size
    if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than 10MB` },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitized = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const filename = `${timestamp}_${sanitized}`;

    // Upload to Vercel Blob
    const blob = await put(`tasks/${taskId}/${filename}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Handle thumbnail generation for images (client-side for now)
    let thumbnailUrl: string | undefined;
    
    // For images, we'll let the client handle thumbnail generation
    // In production, you might want to use a service like Cloudinary or imgix
    if (isImage(file.type)) {
      // Thumbnail will be generated on client-side and uploaded separately if needed
      thumbnailUrl = undefined;
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      thumbnailUrl,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Set max body size to 11MB (slightly larger than max file size)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '11mb',
    },
  },
};

