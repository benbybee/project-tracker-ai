import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';

/**
 * Debug endpoint to inspect Plaud share page HTML
 * This helps diagnose issues with the link import feature
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { shareUrl } = body;

    if (!shareUrl || typeof shareUrl !== 'string') {
      return NextResponse.json(
        { error: 'Share URL is required' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: `Failed to fetch page: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const contentType = response.headers.get('content-type');

    // Extract share ID
    const shareIdMatch = shareUrl.match(/\/share\/([a-zA-Z0-9]+)/);
    const shareId = shareIdMatch ? shareIdMatch[1] : null;

    // Try API endpoints
    const apiResults = [];
    if (shareId) {
      const apiEndpoints = [
        `https://web.plaud.ai/api/share/${shareId}`,
        `https://api.plaud.ai/share/${shareId}`,
        `https://web.plaud.ai/api/public/share/${shareId}`,
      ];

      for (const apiUrl of apiEndpoints) {
        try {
          const apiResponse = await fetch(apiUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'application/json',
            },
          });

          const apiContentType = apiResponse.headers.get('content-type');
          const isJson =
            apiContentType && apiContentType.includes('application/json');

          let data = null;
          if (isJson) {
            try {
              data = await apiResponse.json();
            } catch (e) {
              data = { error: 'Failed to parse JSON' };
            }
          } else {
            const text = await apiResponse.text();
            data = { text: text.substring(0, 500) };
          }

          apiResults.push({
            url: apiUrl,
            status: apiResponse.status,
            ok: apiResponse.ok,
            contentType: apiContentType,
            isJson,
            data: isJson ? data : null,
            preview: JSON.stringify(data).substring(0, 500),
          });
        } catch (error: any) {
          apiResults.push({
            url: apiUrl,
            error: error.message,
          });
        }
      }
    }

    // Extract some key patterns
    const hasNextData = html.includes('__NEXT_DATA__');
    const hasPlaud = html.toLowerCase().includes('plaud');
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;

    // Look for Next.js data
    let nextData = null;
    const nextDataMatch = html.match(
      /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (nextDataMatch && nextDataMatch[1]) {
      try {
        nextData = JSON.parse(nextDataMatch[1]);
      } catch (e) {
        nextData = { error: 'Failed to parse Next.js data' };
      }
    }

    // Look for potential audio URLs
    const audioUrlPatterns = [
      /https?:\/\/[^\s"'<>]+\.(mp3|m4a|wav|ogg|webm|aac)(\?[^\s"'<>]*)?/gi,
      /"audioUrl"\s*:\s*"([^"]+)"/gi,
      /"url"\s*:\s*"(https?:\/\/[^"]+)"/gi,
    ];

    const potentialUrls: string[] = [];
    for (const pattern of audioUrlPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1] || match[0]) {
          potentialUrls.push(match[1] || match[0]);
        }
      }
    }

    // Deduplicate URLs
    const uniqueUrls = [...new Set(potentialUrls)];

    // Extract all script tags to see what JS is being loaded
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    const scripts: string[] = [];
    for (const match of scriptMatches) {
      if (match[1] && match[1].trim()) {
        scripts.push(match[1].trim().substring(0, 500));
      }
    }

    // Look for script src tags
    const scriptSrcMatches = html.matchAll(
      /<script[^>]+src=["']([^"']+)["']/gi
    );
    const scriptSrcs: string[] = [];
    for (const match of scriptSrcMatches) {
      if (match[1]) {
        scriptSrcs.push(match[1]);
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        url: shareUrl,
        shareId,
        contentType,
        htmlLength: html.length,
        hasNextData,
        hasPlaud,
        title,
        potentialAudioUrls: uniqueUrls,
        apiResults,
        fullHtml: html, // Include full HTML since it's small
        scripts,
        scriptSrcs,
        htmlSnippet: html.substring(0, 1000),
        nextDataPreview: nextData
          ? JSON.stringify(nextData).substring(0, 2000)
          : null,
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to debug Plaud link' },
      { status: 500 }
    );
  }
}
