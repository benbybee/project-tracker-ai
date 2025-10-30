# Plaud Link Import Debug Guide

## Overview

The Plaud link import feature extracts audio files from Plaud share links and uses AI to transcribe and extract tasks. This guide explains the recent improvements and how to debug issues.

## Recent Improvements

### 1. **Enhanced Audio URL Extraction**

The system now uses multiple strategies to find the audio URL:

- **API-First Approach**: Tries multiple potential API endpoints before falling back to HTML scraping
  - `https://web.plaud.ai/api/share/{id}`
  - `https://api.plaud.ai/share/{id}`
  - `https://web.plaud.ai/api/public/share/{id}`

- **Improved HTML Scraping**: Multiple patterns to extract audio URLs from HTML:
  - Meta tags (og:audio)
  - JSON structures in the page
  - Source/audio tags
  - Next.js data (`__NEXT_DATA__`)
  - Generic URL pattern matching

- **Better Headers**: More realistic browser headers to avoid being blocked

### 2. **Debug Feature**

A new "Debug Link" button provides detailed information about what the system is fetching:

- HTML content details
- Page structure analysis
- API endpoint test results
- Potential audio URLs found
- Next.js data inspection

### 3. **Enhanced Logging**

Console logs now provide step-by-step information about:

- Which extraction method succeeded
- API endpoint attempts
- HTML parsing results

## How to Debug a Failing Link

### Step 1: Use the Debug Feature

1. Go to the Plaud AI Ingestion page (`/plaud`)
2. Paste your Plaud share link in the input field
3. Click **"Debug Link"** (below the Import button)
4. Review the debug information panel

### Step 2: Analyze the Debug Information

Look for these key indicators:

#### ✅ Good Signs

- **Has Next.js Data**: Yes ✅
- **Has Plaud Branding**: Yes ✅
- **Potential Audio URLs Found**: > 0
- **API Endpoint Results**: At least one with Status 200 ✅

#### ⚠️ Warning Signs

- **Has Next.js Data**: No ❌ (page might be client-side rendered)
- **Potential Audio URLs Found**: 0 (audio might be loaded dynamically)
- **All API endpoints fail**: 404 or other errors

### Step 3: Inspect API Results

Expand the "API Endpoint Results" section:

- Check which endpoints returned 200 OK
- Look for JSON responses
- Examine the preview data for audio URLs

### Step 4: Check Console Logs

Open browser DevTools (F12) and check the Console tab for:

- `[Plaud]` prefixed log messages
- Which extraction method was attempted
- Any error messages

## Common Issues and Solutions

### Issue 1: "Page structure may have changed"

**Likely Cause**: Plaud updated their website structure

**Solution**:

1. Run the debug feature
2. Check the "HTML Snippet" and "Next.js Data Preview"
3. Look for patterns in the data structure
4. Update `src/lib/plaud-import.ts` with new extraction patterns

### Issue 2: "Audio may not be publicly accessible"

**Likely Cause**: The audio file requires authentication

**Possible Solutions**:

- The share link might be private
- Try sharing the recording again with public access
- Check if the link works in an incognito browser window

### Issue 3: API Endpoints All Fail

**Likely Cause**: Plaud doesn't expose these API endpoints or they've changed

**Solution**:

- The system falls back to HTML scraping automatically
- If HTML scraping also fails, check the debug info for the actual page structure

## Technical Details

### Files Modified

1. **`src/lib/plaud-import.ts`**
   - Added API endpoint attempts
   - Enhanced HTML extraction patterns
   - Improved error messages and logging

2. **`src/app/api/plaud/import-link/route.ts`**
   - (No changes needed - uses the updated library)

3. **`src/app/api/plaud/debug-link/route.ts`** (NEW)
   - Debug endpoint for troubleshooting
   - Tests API endpoints
   - Analyzes HTML structure

4. **`src/app/(app)/plaud/page.tsx`**
   - Added debug button and UI
   - Added debug info display panel

### How to Extend the Extraction Logic

If you need to add new extraction patterns, edit `src/lib/plaud-import.ts`:

```typescript
// Add new API endpoint
const apiEndpoints = [
  `https://web.plaud.ai/api/share/${shareId}`,
  `https://api.plaud.ai/share/${shareId}`,
  `https://your-new-endpoint.com/api/${shareId}`, // Add here
];

// Add new HTML pattern
const newPattern = /your-regex-pattern-here/i;
const match = html.match(newPattern);
if (match && match[1]) {
  audioUrl = match[1];
  console.log('[Plaud] Found audio URL via new pattern');
}
```

## Next Steps

1. **Try the Enhanced Version**: Test with your Plaud link
2. **Use Debug Feature**: If it fails, click "Debug Link" and share the results
3. **Check Console Logs**: Look for `[Plaud]` messages in the browser console
4. **Report Findings**: Share debug info to help improve the extraction logic

## Questions or Issues?

If you continue to have issues:

1. Make sure you're using a public Plaud share link
2. Test the link in an incognito window to ensure it's publicly accessible
3. Use the debug feature and check what data is actually being returned
4. Check if Plaud has changed their share page structure
