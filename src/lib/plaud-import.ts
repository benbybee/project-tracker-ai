/**
 * Plaud Audio Import Utilities
 *
 * Handles fetching and parsing audio files from Plaud share links.
 * Example link: https://web.plaud.ai/share/61071761620824397
 */

export interface PlaudAudioData {
  audioUrl: string;
  title?: string;
  transcript?: string;
  duration?: number;
}

/**
 * Extract share ID from Plaud share URL
 */
function extractShareId(shareUrl: string): string | null {
  try {
    const url = new URL(shareUrl);

    // Match pattern: https://web.plaud.ai/share/{id}
    const pathMatch = url.pathname.match(/\/share\/([a-zA-Z0-9]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    return null;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

/**
 * Fetch audio data from Plaud share link
 *
 * This function fetches the Plaud share page and attempts to extract
 * the audio file URL and metadata from the page.
 */
export async function fetchPlaudAudio(
  shareUrl: string
): Promise<PlaudAudioData> {
  const shareId = extractShareId(shareUrl);

  if (!shareId) {
    throw new Error('Invalid Plaud share URL format');
  }

  try {
    // Fetch the share page HTML
    const response = await fetch(shareUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Plaud page: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract audio URL from various possible locations in the HTML
    let audioUrl: string | null = null;
    let title: string | null = null;
    let transcript: string | null = null;

    // Try to find audio URL in meta tags
    const metaAudioMatch = html.match(
      /<meta[^>]+property=["']og:audio["'][^>]+content=["']([^"']+)["']/i
    );
    if (metaAudioMatch && metaAudioMatch[1]) {
      audioUrl = metaAudioMatch[1];
    }

    // Try to find audio URL in JavaScript/JSON data
    if (!audioUrl) {
      // Look for patterns like "audioUrl":"..." or audioUrl: "..."
      const jsAudioMatch = html.match(
        /["']?audioUrl["']?\s*[:=]\s*["']([^"']+)["']/i
      );
      if (jsAudioMatch && jsAudioMatch[1]) {
        audioUrl = jsAudioMatch[1];
      }
    }

    // Try to find direct audio source tags
    if (!audioUrl) {
      const sourceMatch = html.match(
        /<source[^>]+src=["']([^"']+\.(?:mp3|m4a|wav))["']/i
      );
      if (sourceMatch && sourceMatch[1]) {
        audioUrl = sourceMatch[1];
      }
    }

    // Try to find audio tags
    if (!audioUrl) {
      const audioTagMatch = html.match(/<audio[^>]+src=["']([^"']+)["']/i);
      if (audioTagMatch && audioTagMatch[1]) {
        audioUrl = audioTagMatch[1];
      }
    }

    // Try to extract from Next.js data or window.__NEXT_DATA__
    if (!audioUrl) {
      const nextDataMatch = html.match(
        /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
      );
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          // Navigate through the data structure to find audio URL
          const findAudioUrl = (obj: any): string | null => {
            if (
              typeof obj === 'string' &&
              (obj.includes('.mp3') ||
                obj.includes('.m4a') ||
                obj.includes('.wav'))
            ) {
              return obj;
            }
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                if (
                  key.toLowerCase().includes('audio') ||
                  key.toLowerCase().includes('url')
                ) {
                  const result = findAudioUrl(obj[key]);
                  if (result) return result;
                }
              }
              // Recursively search all properties
              for (const key in obj) {
                const result = findAudioUrl(obj[key]);
                if (result) return result;
              }
            }
            return null;
          };
          audioUrl = findAudioUrl(nextData);
        } catch (e) {
          console.error('Failed to parse Next.js data:', e);
        }
      }
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/\s*-\s*Plaud\s*AI?\s*/i, '').trim();
    }

    // Extract transcript if available
    const transcriptMatch = html.match(
      /["']?transcript["']?\s*[:=]\s*["']([^"']+)["']/i
    );
    if (transcriptMatch && transcriptMatch[1]) {
      transcript = transcriptMatch[1];
    }

    if (!audioUrl) {
      throw new Error(
        'Could not extract audio URL from Plaud share page. The page structure may have changed or the audio may not be publicly accessible.'
      );
    }

    // Ensure absolute URL
    if (audioUrl.startsWith('//')) {
      audioUrl = 'https:' + audioUrl;
    } else if (audioUrl.startsWith('/')) {
      audioUrl = 'https://web.plaud.ai' + audioUrl;
    }

    return {
      audioUrl,
      title: title || `Plaud Recording ${shareId}`,
      transcript: transcript || undefined,
      duration: undefined, // Will be determined during transcription
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch audio from Plaud share link');
  }
}

/**
 * Download audio file from URL as a Blob
 */
export async function downloadAudioBlob(audioUrl: string): Promise<Blob> {
  try {
    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Verify it's an audio file
    if (!blob.type.startsWith('audio/')) {
      // If content-type is not set, try to infer from URL
      if (!audioUrl.match(/\.(mp3|m4a|wav|webm|ogg|aac)$/i)) {
        throw new Error('Downloaded file does not appear to be an audio file');
      }
    }

    return blob;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to download audio file');
  }
}
