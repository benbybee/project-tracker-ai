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

  // Try API endpoints first (faster and more reliable than scraping)
  const apiEndpoints = [
    `https://web.plaud.ai/api/share/${shareId}`,
    `https://api.plaud.ai/share/${shareId}`,
    `https://web.plaud.ai/api/public/share/${shareId}`,
    `https://api.plaud.ai/api/share/${shareId}`,
    `https://api.plaud.ai/v1/share/${shareId}`,
    `https://web.plaud.ai/api/v1/share/${shareId}`,
    `https://api.plaud.ai/api/v1/shares/${shareId}`,
    `https://web.plaud.ai/api/recordings/${shareId}`,
    `https://api.plaud.ai/recordings/${shareId}`,
  ];

  for (const apiUrl of apiEndpoints) {
    try {
      console.log(`[Plaud] Trying API endpoint: ${apiUrl}`);
      const apiResponse = await fetch(apiUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (apiResponse.ok) {
        const contentType = apiResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await apiResponse.json();
          console.log('[Plaud] API response received:', Object.keys(data));

          // Try to extract audio URL from API response
          const extractAudioFromApi = (obj: any): string | null => {
            if (
              typeof obj === 'string' &&
              obj.match(/^https?:\/\/.+\.(mp3|m4a|wav|ogg|webm|aac)/i)
            ) {
              return obj;
            }
            if (typeof obj === 'object' && obj !== null) {
              const keys = [
                'audioUrl',
                'audio_url',
                'audio',
                'url',
                'fileUrl',
                'file_url',
                'src',
                'source',
              ];
              for (const key of keys) {
                if (key in obj && typeof obj[key] === 'string') {
                  return obj[key];
                }
              }
              // Recursive search
              for (const key in obj) {
                const result = extractAudioFromApi(obj[key]);
                if (result) return result;
              }
            }
            return null;
          };

          const audioUrl = extractAudioFromApi(data);
          if (audioUrl) {
            console.log('[Plaud] Found audio URL via API');
            return {
              audioUrl,
              title: data.title || data.name || `Plaud Recording ${shareId}`,
              transcript: data.transcript || data.transcription || undefined,
              duration: data.duration || undefined,
            };
          }
        }
      }
    } catch (error) {
      console.log(`[Plaud] API endpoint ${apiUrl} failed:`, error);
      // Continue to next endpoint
    }
  }

  // Fall back to HTML scraping
  console.log('[Plaud] API endpoints failed, falling back to HTML scraping');

  try {
    // Fetch the share page HTML
    const response = await fetch(shareUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Plaud page: ${response.statusText}`);
    }

    const html = await response.text();

    // Log HTML length for debugging
    console.log(`[Plaud] Fetched HTML: ${html.length} bytes`);

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
      console.log('[Plaud] Found audio URL in og:audio meta tag');
    }

    // Try alternate meta tag format
    if (!audioUrl) {
      const metaAudioMatch2 = html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:audio["']/i
      );
      if (metaAudioMatch2 && metaAudioMatch2[1]) {
        audioUrl = metaAudioMatch2[1];
        console.log(
          '[Plaud] Found audio URL in og:audio meta tag (alt format)'
        );
      }
    }

    // Try to find audio URL in JavaScript/JSON data
    if (!audioUrl) {
      // Look for patterns like "audioUrl":"..." or audioUrl: "..."
      const jsAudioMatch = html.match(
        /["']?audioUrl["']?\s*[:=]\s*["']([^"']+)["']/i
      );
      if (jsAudioMatch && jsAudioMatch[1]) {
        audioUrl = jsAudioMatch[1];
        console.log('[Plaud] Found audio URL in JavaScript');
      }
    }

    // Try to find URL in JSON structures (e.g., {"url":"...", "audioUrl":"..."})
    if (!audioUrl) {
      const jsonUrlPatterns = [
        /"url"\s*:\s*"(https?:\/\/[^"]*\.(mp3|m4a|wav|ogg)[^"]*)"/gi,
        /"audioUrl"\s*:\s*"(https?:\/\/[^"]+)"/gi,
        /"audio"\s*:\s*"(https?:\/\/[^"]+)"/gi,
        /"src"\s*:\s*"(https?:\/\/[^"]*\.(mp3|m4a|wav|ogg)[^"]*)"/gi,
      ];

      for (const pattern of jsonUrlPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            audioUrl = match[1];
            console.log('[Plaud] Found audio URL in JSON structure');
            break;
          }
        }
        if (audioUrl) break;
      }
    }

    // Try to find direct audio source tags
    if (!audioUrl) {
      const sourceMatch = html.match(
        /<source[^>]+src=["']([^"']+\.(?:mp3|m4a|wav))["']/i
      );
      if (sourceMatch && sourceMatch[1]) {
        audioUrl = sourceMatch[1];
        console.log('[Plaud] Found audio URL in source tag');
      }
    }

    // Try to find audio tags
    if (!audioUrl) {
      const audioTagMatch = html.match(/<audio[^>]+src=["']([^"']+)["']/i);
      if (audioTagMatch && audioTagMatch[1]) {
        audioUrl = audioTagMatch[1];
        console.log('[Plaud] Found audio URL in audio tag');
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
          console.log('[Plaud] Found __NEXT_DATA__, searching for audio URL');

          // Navigate through the data structure to find audio URL
          const findAudioUrl = (
            obj: any,
            depth = 0,
            maxDepth = 10
          ): string | null => {
            if (depth > maxDepth) return null;

            if (typeof obj === 'string') {
              // Check if this looks like an audio URL
              if (
                obj.match(
                  /^https?:\/\/.+\.(mp3|m4a|wav|ogg|webm|aac)(\?.*)?$/i
                ) ||
                (obj.includes('audio') && obj.match(/^https?:\/\//))
              ) {
                return obj;
              }
            }

            if (typeof obj === 'object' && obj !== null) {
              // First, check keys that are likely to contain audio URLs
              const priorityKeys = [
                'audioUrl',
                'audio',
                'url',
                'src',
                'source',
                'file',
                'fileUrl',
              ];
              for (const key of priorityKeys) {
                if (key in obj) {
                  const result = findAudioUrl(obj[key], depth + 1, maxDepth);
                  if (result) return result;
                }
              }

              // Then recursively search all properties
              for (const key in obj) {
                const result = findAudioUrl(obj[key], depth + 1, maxDepth);
                if (result) return result;
              }
            }
            return null;
          };

          audioUrl = findAudioUrl(nextData);
          if (audioUrl) {
            console.log('[Plaud] Found audio URL in __NEXT_DATA__');
          }
        } catch (e) {
          console.error('[Plaud] Failed to parse Next.js data:', e);
        }
      } else {
        console.log('[Plaud] No __NEXT_DATA__ found in HTML');
      }
    }

    // Try to find any https URL that looks like an audio file
    if (!audioUrl) {
      const audioUrlPattern =
        /https?:\/\/[^\s"'<>]+\.(mp3|m4a|wav|ogg|webm|aac)(\?[^\s"'<>]*)?/gi;
      const matches = html.match(audioUrlPattern);
      if (matches && matches.length > 0) {
        audioUrl = matches[0];
        console.log('[Plaud] Found audio URL via generic pattern match');
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
      // Log some diagnostics for debugging
      console.error('[Plaud] Failed to find audio URL');
      console.error('[Plaud] HTML snippet:', html.substring(0, 500));
      console.error('[Plaud] Page title:', title);

      // Check if the page looks like a valid Plaud share page
      const hasPlaudBranding = html.toLowerCase().includes('plaud');
      const hasNextData = html.includes('__NEXT_DATA__');

      let errorDetails = 'Could not extract audio URL from Plaud share page.';
      if (!hasPlaudBranding) {
        errorDetails += ' The page does not appear to be a Plaud page.';
      }
      if (!hasNextData) {
        errorDetails +=
          ' The page structure appears to be different than expected (no Next.js data found).';
      }
      errorDetails +=
        ' The page structure may have changed or the audio may not be publicly accessible.';

      throw new Error(errorDetails);
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
