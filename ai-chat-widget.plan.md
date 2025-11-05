<!-- ecb9d6bc-5ba6-42b4-9e98-91452047a920 78452740-7e9b-4cf1-91d5-6bf161a2698c -->
# Chat Tags & Commands System Implementation

## Overview

Add inline tagging system using `@` for entities (projects, roles) and `/` for commands/parameters, with autocomplete, visual highlighting, and client-side parsing.

## Tag Types

### Entity Tags (@)

- `@projectname` - Reference a specific project
- Future: `@taskname`, `@username` (if needed)

### Command/Parameter Tags (/)

- `/task <name>` - Task name/title
- `/projectname <name>` - Project name
- `/userole <name>` - User role name
- `/priority <level>` - Priority (low, medium, high, urgent)
- `/duedate <date>` - Due date (natural language: tomorrow, next week, 2024-12-25)
- `/status <status>` - Status (not_started, in_progress, completed, blocked)
- `/notes <text>` - Notes/description text

## Phase 1: Parser Utility

### File: `src/lib/chat-tags-parser.ts`

Create a robust parser that:

1. Detects all `@projectname` mentions
2. Detects all `/command value` parameters
3. Validates entity references against database
4. Returns structured data:
```typescript
{
  originalMessage: string;
  cleanMessage: string; // Tags stripped
  tags: {
    projects: string[]; // Matched project IDs
    task?: string;
    projectName?: string;
    userRole?: string;
    priority?: string;
    dueDate?: string;
    status?: string;
    notes?: string;
  };
  unmatchedTags: string[]; // For error feedback
}
```


### Parsing Rules

- Tags can appear anywhere in message
- Multiple `@project` tags allowed
- Only one of each `/command` type per message
- Values after `/` continue until next tag or end
- Support quoted values: `/task "multi word task name"`
- Case-insensitive tag matching

## Phase 2: Enhanced Input Component

### File: `src/components/ai/ai-chat-enhanced-input.tsx`

Rich input component with:

#### Visual Feedback

- Highlight `@projectname` in purple/pink when matched
- Highlight `/command` in blue when recognized
- Grey out unmatched/invalid tags
- Show validation errors inline

#### Autocomplete System

- Trigger on `@` - show dropdown of projects (search as you type)
- Trigger on `/` - show dropdown of available commands
- Arrow keys + Enter to select
- ESC to dismiss
- Click to select
- Show command syntax hints (e.g., "/task <task name>")

#### Component Structure

```typescript
<div className="relative">
  <ContentEditable
    onChange={handleChange}
    onKeyDown={handleKeyDown}
    content={richContent} // HTML with styled spans
  />
  {showAutocomplete && (
    <AutocompleteDropdown
      items={autocompleteItems}
      position={cursorPosition}
      onSelect={handleSelect}
    />
  )}
</div>
```

### File: `src/components/ai/ai-chat-autocomplete-dropdown.tsx`

Dropdown component:

- Positioned relative to cursor
- Keyboard navigation (up/down/enter)
- Search filtering
- Category headers (Projects, Commands)
- Icon for each item type
- Smooth animations

## Phase 3: Data Fetching Hooks

### File: `src/hooks/use-chat-autocomplete-data.ts`

Custom hook to fetch and cache:

- All user's projects (for @project)
- All user's roles (for /userole)
- Command list with descriptions
- Debounced search for large lists
```typescript
const { projects, roles, commands } = useChatAutocompleteData();
```


## Phase 4: Integration with Chat Widget

### Update: `src/components/ai/ai-chat-widget.tsx`

Replace standard input with enhanced input:

1. Import `AiChatEnhancedInput`
2. Handle parsed tag data in `handleSend`
3. Pass structured tags to API
4. Show validation errors from parser
5. Maintain all existing functionality

Changes to `handleSend`:

```typescript
const handleSend = async () => {
  const parsed = parseChatTags(input, { projects, roles });
  
  if (parsed.unmatchedTags.length > 0) {
    // Show error for unmatched tags
    return;
  }
  
  // Send to API with structured data
  await fetch('/api/ai/chat', {
    body: JSON.stringify({
      message: parsed.cleanMessage,
      tags: parsed.tags,
      originalMessage: parsed.originalMessage,
      // ... other fields
    })
  });
};
```

## Phase 5: API & AI System Prompt Updates

### Update: `src/app/api/ai/chat/route.ts`

1. Accept `tags` field in request body
2. Validate tag references (projects/roles exist)
3. Build enhanced system prompt with tag context
4. Pass structured data to OpenAI tools

Enhanced system prompt example:

```
USER QUERY: "setup hosting for client"

TAGGED CONTEXT:
- Project: @summit (ID: abc-123, Type: website)
- Task Name: /task "setup hosting"
- Priority: /priority high

The user wants to create a task named "setup hosting" for the Summit project with high priority. Use the create_task tool with:
- projectName: "summit"
- title: "setup hosting"
- priorityScore: "3"
```

### Update Tool Calling Logic

When tags are provided, pre-populate tool parameters:

- `@project` → automatically resolve to project ID/name
- `/task` → use as task title
- `/priority` → convert to priorityScore
- `/duedate` → parse and format
- etc.

This reduces back-and-forth with AI asking for details.

## Phase 6: Natural Language Date Parser

### File: `src/lib/parse-natural-date.ts`

Parse natural language dates:

- "today", "tomorrow", "yesterday"
- "next week", "next monday"
- "in 3 days", "in 2 weeks"
- Specific dates: "2024-12-25", "Dec 25"
- Return ISO date string or null

Use library like `date-fns` for robust parsing.

## Phase 7: Styling & Polish

### Tag Styling

```css
.tag-project { 
  color: #a855f7; /* purple-500 */
  font-weight: 600;
  background: #f3e8ff; /* purple-50 */
  padding: 0 4px;
  border-radius: 4px;
}

.tag-command {
  color: #3b82f6; /* blue-500 */
  font-weight: 600;
  background: #dbeafe; /* blue-50 */
  padding: 0 4px;
  border-radius: 4px;
}

.tag-invalid {
  color: #ef4444; /* red-500 */
  text-decoration: line-through;
}
```

### Autocomplete Dropdown Styling

- Card with shadow
- Smooth slide-in animation
- Hover states
- Selected state highlighting
- Max height with scroll
- Loading skeleton

## Phase 8: Error Handling & UX

### Validation Messages

- "Project '@projectname' not found. Did you mean @otherproject?"
- "Invalid priority level. Use: low, medium, high, or urgent"
- "Invalid date format for /duedate"
- "Unknown command: /invalidcommand"

### User Education

- Tooltip on input field explaining tags
- Show examples in empty state
- Inline hints as user types
- Help button with full documentation

### Edge Cases

- Empty tag (just "@" or "/")
- Duplicate tags (e.g., two /task commands)
- Tag at start/end of message
- Tag with special characters
- Very long tag values

## Implementation Order

1. **Parser utility** - Core parsing logic
2. **Autocomplete dropdown** - Reusable component
3. **Data hooks** - Fetch projects/roles
4. **Enhanced input** - Rich text input with highlighting
5. **Date parser** - Natural language dates
6. **Chat widget integration** - Wire everything together
7. **API updates** - Handle structured tags
8. **Styling & polish** - Visual refinements
9. **Error handling** - Validation and feedback
10. **Testing** - Comprehensive test cases

## Testing Scenarios

### Functional Tests

- [ ] Parse @project correctly
- [ ] Autocomplete shows projects
- [ ] Select from autocomplete inserts tag
- [ ] Highlight matched tags
- [ ] Show error for unmatched tags
- [ ] Multiple tags in one message
- [ ] All command types work
- [ ] Natural date parsing works
- [ ] API receives structured data
- [ ] AI uses tag context correctly

### Edge Cases

- [ ] Very long project names
- [ ] Special characters in values
- [ ] Rapid typing with autocomplete
- [ ] Keyboard navigation in dropdown
- [ ] Mobile touch interactions
- [ ] Copy/paste with tags
- [ ] Undo/redo functionality

## Example Usage

```
Input: "add /task setup hosting @summit /priority high /duedate tomorrow"

Parsed:
{
  cleanMessage: "add setup hosting",
  tags: {
    projects: ["summit-project-id"],
    task: "setup hosting",
    priority: "high",
    dueDate: "2024-11-05"
  }
}

System Prompt:
"User wants to create task 'setup hosting' for Summit project, 
high priority, due tomorrow (2024-11-05). Use create_task tool."
```

## Benefits

1. **Faster interactions** - No need for AI to ask follow-up questions
2. **More accurate** - Exact entity references (no ambiguity)
3. **Better UX** - Visual feedback and autocomplete
4. **Less tokens** - Structured data vs natural language parsing
5. **Error prevention** - Validation before sending to AI

## Success Criteria

- ✅ Tags parse correctly 100% of the time
- ✅ Autocomplete appears within 100ms
- ✅ Visual highlighting updates in real-time
- ✅ Invalid tags show clear error messages
- ✅ AI uses tag context without asking questions
- ✅ Works on both mobile and desktop
- ✅ Keyboard navigation is smooth
- ✅ No performance impact on typing

## Implementation Status

### ✅ Completed Features

1. **Parser Utility** (`src/lib/chat-tags-parser.ts`)
   - Entity tags (@project) with fuzzy matching
   - Command tags (/task, /priority, /duedate, etc.)
   - Natural language date parsing (integrated)
   - Validation and error reporting
   - Support for quoted values

2. **Enhanced Input** (`src/components/ai/ai-chat-enhanced-input.tsx`)
   - Real-time tag parsing and validation
   - Visual error feedback
   - Tag legend showing parsed data
   - Integration with autocomplete system

3. **Autocomplete Dropdown** (`src/components/ai/ai-chat-autocomplete-dropdown.tsx`)
   - Keyboard navigation (Arrow keys, Enter, Escape)
   - Grouped categories (Projects, Roles, Commands)
   - Smooth animations with framer-motion
   - Mobile-responsive positioning

4. **Data Fetching** (`src/hooks/use-chat-autocomplete-data.ts`)
   - Fetches projects via tRPC
   - Fetches roles via tRPC
   - Provides command list
   - Filters and searches autocomplete items

5. **Chat Widget Integration** (`src/components/ai/ai-chat-widget.tsx`)
   - Uses enhanced input component
   - Session management with history
   - Sends structured tag data to API
   - Mobile-responsive design with sidebar

6. **History & Session Management**
   - AI chat sessions table in database
   - AI chat messages table in database
   - Session list sidebar with search
   - Message history persistence
   - Session cleanup endpoint

7. **API Integration** (`src/app/api/ai/chat/route.ts`)
   - Accepts and validates tags from client
   - Builds enhanced system prompt with tagged context
   - Pre-populates tool parameters from tags
   - Creates/manages chat sessions

8. **Database Schema** (`src/server/db/schema.ts`)
   - `aiChatSessions` table
   - `aiChatMessages` table
   - Migration: `0022_add_ai_chat_sessions.sql`

### 🔧 Deployment Fixes Applied

**Next.js 15 Compatibility:**
- Route params are now Promises (must await)
  - Fixed: `src/app/api/ai/chat/sessions/[id]/route.ts`
  - Fixed: `src/app/api/ai/chat/sessions/[id]/messages/route.ts`

**TypeScript Strict Types:**
- Added explicit type annotation for `chatSessionId: string`
- Added fallback strings for all message content (can't be undefined)
- Changed framer-motion props from `false` to `undefined`
- Added `as const` assertions for literal types in autocomplete items

### 📁 Files Created

**Components:**
- `src/components/ai/ai-chat-widget.tsx`
- `src/components/ai/ai-chat-enhanced-input.tsx`
- `src/components/ai/ai-chat-autocomplete-dropdown.tsx`
- `src/components/ai/ai-chat-history-sidebar.tsx`
- `src/components/ai/ai-chat-overlay.tsx`
- `src/components/ai/ai-chat-floating-button.tsx`
- `src/components/mobile/mobile-header.tsx`

**Utilities & Hooks:**
- `src/lib/chat-tags-parser.ts`
- `src/hooks/use-chat-autocomplete-data.ts`

**API Routes:**
- `src/app/api/ai/chat/sessions/route.ts`
- `src/app/api/ai/chat/sessions/[id]/route.ts`
- `src/app/api/ai/chat/sessions/[id]/messages/route.ts`
- `src/app/api/ai/chat/cleanup/route.ts`

**Database:**
- `src/server/db/migrations/0022_add_ai_chat_sessions.sql`

### 🚀 Deployment Notes

**Key TypeScript Fixes Required:**
1. Use `Promise<{ id: string }>` for Next.js 15 route params
2. Initialize `chatSessionId` as `string` type (not `string | undefined`)
3. Always provide fallback strings for optional message content
4. Use `undefined` (not `false`) for conditional framer-motion props
5. Use `as const` for literal type assertions in mapped objects

**Example - Next.js 15 Route Params:**
```typescript
// Old way (Next.js 14):
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
}

// New way (Next.js 15):
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**Example - Literal Type Assertions:**
```typescript
// Without as const, TypeScript infers type as string
type: 'project', // Type: string

// With as const, TypeScript infers exact literal type
type: 'project' as const, // Type: 'project'
```

**Dependencies Used:**
- `date-fns` - Natural language date parsing
- `framer-motion` - Smooth animations
- `lucide-react` - Icons

### To-dos

- [x] Apply app branding, animations, and responsive design
- [x] Implement parser utility
- [x] Create autocomplete dropdown
- [x] Add data fetching hooks
- [x] Build enhanced input component
- [x] Integrate natural language date parser
- [x] Wire everything into chat widget
- [x] Update API to handle structured tags
- [x] Apply styling and polish
- [x] Implement error handling
- [x] Fix Next.js 15 compatibility issues
- [x] Resolve all TypeScript type errors
- [x] Deploy to production

## 🎉 Status: COMPLETED & DEPLOYED

