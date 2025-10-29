# Project Tracker AI - System Architecture & Documentation

**Version:** 0.1.1  
**Last Updated:** October 29, 2025  
**Type:** Full-Stack Task Management Application with AI

---

## 📋 Executive Summary

**Project Tracker AI** is a production-ready, full-stack task management and project tracking application with AI-powered features. Built with Next.js 15, TypeScript, tRPC, Drizzle ORM, and Supabase PostgreSQL.

### Core Purpose
An intelligent task and project management system that learns from user behavior to provide:
- AI-powered daily planning and task suggestions
- Semantic search across tasks and projects
- Support ticket system with automatic task generation
- Real-time collaboration features
- Offline-first architecture with sync

---

## 🏗️ Technology Stack

### Framework & Runtime
- **Next.js 15** (App Router) - React framework with server/client components
- **TypeScript 5.3** (strict mode) - Type-safe development
- **React 18.3.1** - UI library
- **Node.js ≥18.18** - Runtime environment

### API & Data Layer
- **tRPC 10.45** - End-to-end type-safe API (no REST)
- **Drizzle ORM 0.29** - Type-safe SQL query builder
- **PostgreSQL** (via Supabase) - Primary database
- **pgvector** - Vector embeddings for semantic search
- **SuperJSON** - Serialization for complex types

### Authentication & Security
- **NextAuth v4** - Authentication with JWT sessions
- **bcryptjs** - Password hashing (12 rounds)
- Credentials provider (email/password)
- Row-level security on all queries

### AI & Machine Learning
- **OpenAI GPT-4** - Daily planning, ticket analysis, task generation
- **OpenAI GPT-3.5 Turbo** - Task estimation, priority suggestions
- **text-embedding-3-small** - Semantic search embeddings

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion 12** - Animations and transitions
- **Radix UI** - Headless accessible components
- **Lucide React** - Icon library

### State Management
- **TanStack Query v4** (React Query) - Server state & caching
- **Zustand 4.4** - Client state (UI, planner)
- **Dexie 4.2** - IndexedDB wrapper for offline storage

### Forms & Validation
- **react-hook-form 7.49** - Form state management
- **Zod 3.22** - Schema validation & type inference

### File Storage
- **Vercel Blob** - File uploads for ticket attachments

### Development Tools
- **Vitest 4.0** - Unit testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **pnpm 8.15** - Package manager (required)

---

## 🗄️ Database Schema

### Core Entities

#### users
Primary user accounts with authentication.
```typescript
{
  id: uuid (PK)
  email: text (unique, not null)
  name: text (nullable)
  passwordHash: text (not null)
  createdAt: timestamp (default now)
  updatedAt: timestamp (default now)
}
```

#### roles
Organizational categories (e.g., "Frontend", "Backend", "Marketing").
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users, cascade delete)
  name: text (not null)
  color: text (hex color, not null)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### projects
Main containers for tasks. Supports general or website project types.
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users, cascade delete)
  name: text (not null)
  type: enum ('general', 'website')
  description: text
  roleId: uuid (FK → roles, nullable)
  notes: text
  pinned: boolean (default false)
  
  // Website-specific fields
  domain: text
  hostingProvider: text
  dnsStatus: text
  goLiveDate: date
  repoUrl: text
  stagingUrl: text
  checklistJson: jsonb
  websiteStatus: enum ('discovery', 'development', 'client_review', 'completed', 'blocked')
  
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### tasks
Individual work items with comprehensive tracking.
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users, cascade delete)
  projectId: uuid (FK → projects, not null)
  roleId: uuid (FK → roles, nullable)
  ticketId: uuid (FK → tickets, nullable)
  title: text (not null)
  description: text
  status: enum (not null, default 'not_started')
    // Options: 'not_started', 'in_progress', 'blocked', 'completed',
    //          'content', 'design', 'dev', 'qa', 'launch'
  weekOf: date
  progress: integer (default 0)
  dueDate: date (nullable)
  isDaily: boolean (default false) // For daily planner tasks
  priorityScore: enum ('1', '2', '3', '4', default '2') // 1=highest
  blockedReason: text
  blockedDetails: text
  blockedAt: timestamp
  archived: boolean (default false)
  archivedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### subtasks
Checklist items within tasks.
```typescript
{
  id: uuid (PK)
  taskId: uuid (FK → tasks, not null)
  title: text (not null)
  completed: boolean (default false)
  position: integer (not null)
  createdAt: timestamp
}
```

#### embeddings
Vector embeddings for AI semantic search.
```typescript
{
  id: uuid (PK)
  entityType: enum ('task', 'project')
  entityId: uuid (not null)
  chunkIndex: integer (not null)
  chunkText: text (not null)
  embedding: text (vector stored as text)
  createdAt: timestamp
}
```

### Support Ticket System

#### tickets
Customer support requests with AI-powered analysis.
```typescript
{
  id: uuid (PK)
  customerName: text (not null)
  customerEmail: text (not null)
  projectName: text (not null)
  domain: text
  details: text (not null)
  dueDateSuggested: date
  priority: enum ('low', 'normal', 'high', 'urgent', default 'normal')
  status: enum ('new', 'viewed', 'pending_tasks', 'complete', 
                'in_review', 'responded', 'converted', 'closed', default 'new')
  aiEta: date // AI-calculated estimated completion
  aiSummary: text // GPT-4 generated summary
  suggestedProjectId: uuid (FK → projects)
  completedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### ticketReplies
```typescript
{
  id: uuid (PK)
  ticketId: uuid (FK → tickets, cascade delete)
  author: enum ('admin', 'requester')
  message: text (not null)
  createdAt: timestamp
}
```

#### ticketAttachments
```typescript
{
  id: uuid (PK)
  ticketId: uuid (FK → tickets, cascade delete)
  fileName: text (not null)
  fileSize: bigint
  url: text (Vercel Blob URL)
  createdAt: timestamp
}
```

### Notes System

#### notes
Text or audio notes with AI task generation capability.
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users, cascade delete)
  projectId: uuid (FK → projects, cascade delete)
  title: text (not null)
  content: text (not null)
  noteType: enum ('text', 'audio', default 'text')
  audioUrl: text
  audioDuration: integer // seconds
  tasksGenerated: boolean (default false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Collaboration Features

#### threads
Chat threads for project/task discussions.
```typescript
{
  id: uuid (PK)
  projectId: uuid (FK → projects, not null)
  taskId: uuid (FK → tasks, nullable)
  title: text (not null)
  description: text
  isActive: boolean (default true)
  lastMessageAt: timestamp
  messageCount: integer (default 0)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### messages
```typescript
{
  id: uuid (PK)
  threadId: uuid (FK → threads, not null)
  userId: uuid (FK → users, not null)
  content: text (not null)
  messageType: enum ('text', 'system', 'mention', 'reaction', default 'text')
  metadata: jsonb
  replyToId: uuid (self-reference)
  isEdited: boolean (default false)
  editedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### messageReactions
```typescript
{
  id: uuid (PK)
  messageId: uuid (FK → messages, not null)
  userId: uuid (FK → users, not null)
  emoji: text (not null)
  createdAt: timestamp
}
```

#### threadParticipants
```typescript
{
  id: uuid (PK)
  threadId: uuid (FK → threads, not null)
  userId: uuid (FK → users, not null)
  joinedAt: timestamp
  lastReadAt: timestamp
  isActive: boolean (default true)
}
```

### Activity & Notifications

#### activityLog
Complete audit trail of all user actions.
```typescript
{
  id: uuid (PK)
  actorId: uuid (FK → users, not null)
  targetType: enum ('task', 'project', 'comment', 'sync', 'system')
  targetId: uuid
  action: enum ('created', 'updated', 'deleted', 'assigned', 'completed',
                'commented', 'mentioned', 'synced', 'conflict_resolved')
  payload: jsonb
  projectId: uuid (FK → projects)
  taskId: uuid (FK → tasks)
  createdAt: timestamp
}
```

#### notifications
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users, not null)
  type: enum ('task_assigned', 'task_updated', 'task_completed',
              'project_updated', 'comment_added', 'mention', 
              'sync_conflict', 'collaboration')
  title: text (not null)
  message: text (not null)
  link: text
  read: boolean (default false)
  metadata: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

### AI Analytics

#### taskAnalytics
Tracks actual time spent on tasks for AI learning.
```typescript
{
  id: uuid (PK)
  taskId: uuid (FK → tasks, cascade delete)
  userId: uuid (FK → users, not null)
  startedAt: timestamp // When task moved to 'in_progress'
  completedAt: timestamp // When task marked 'completed'
  actualDurationMinutes: integer // Calculated duration
  estimatedDurationMinutes: integer
  createdAt: timestamp
}
```

**Automatic Tracking:**
- `startedAt` recorded when task status changes to `in_progress`
- `completedAt` recorded when task status changes to `completed`
- `actualDurationMinutes` calculated automatically
- Used by AI to learn user velocity and task duration patterns

#### userPatterns
Learned productivity patterns for AI personalization.
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users, not null)
  patternType: enum ('completion_time', 'productive_hours', 
                     'task_category_duration', 'postponement_pattern', 'velocity')
  patternData: jsonb // Flexible structure per pattern type
  confidenceScore: real (0.0 to 1.0)
  lastUpdated: timestamp
  createdAt: timestamp
}
```

**Pattern Types:**
- `completion_time`: Average duration by priority level
- `productive_hours`: Most productive hours of day (0-23)
- `task_category_duration`: Average duration by role/category
- `postponement_pattern`: Rescheduling behavior
- `velocity`: Tasks per day/week + trend

#### aiSuggestions
Tracks AI suggestions and user responses for learning.
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users, not null)
  suggestionType: enum ('daily_plan', 'task_priority', 'time_estimate',
                        'schedule', 'focus_block', 'break_reminder')
  taskId: uuid (FK → tasks, cascade delete)
  suggestionData: jsonb // The actual suggestion content
  accepted: jsonb // null (not responded), true/false, or partial acceptance
  feedback: text
  createdAt: timestamp
  respondedAt: timestamp
}
```

#### plaudPending
Plaud AI voice recorder integration staging.
```typescript
{
  id: uuid (PK)
  title: text (not null)
  description: text
  confidence: integer (0-100)
  sourceId: text // Drive file ID, transcript ID, etc.
  suggestedProjectName: text
  createdAt: timestamp
}
```

---

## 🔌 API Architecture (tRPC)

All API communication uses tRPC for end-to-end type safety. The main router (`src/server/trpc/root.ts`) exposes these sub-routers:

### 1. Auth Router (`routers/auth.ts`)

#### `auth.register` (public)
```typescript
Input: { email: string, password: string (min 8) }
Logic:
  1. Check if user exists
  2. Hash password with bcrypt (12 rounds)
  3. Create user in database
Returns: { id, email }
```

#### `auth.login` (public)
```typescript
Input: { email: string, password: string }
Logic:
  1. Find user by email
  2. Compare password with bcrypt
  3. Return user if valid
Returns: { id, email }
```

#### `auth.me` (public)
```typescript
Logic: Returns current user from session
Returns: User | null
```

### 2. Roles Router (`routers/roles.ts`)

#### `roles.list` (protected)
```typescript
Logic: Fetches all roles for current user, ordered by name
Returns: Role[]
```

#### `roles.create` (protected)
```typescript
Input: { name: string, color: string }
Returns: Role
```

#### `roles.update` (protected)
```typescript
Input: { id: string, name?: string, color?: string }
Returns: Role
```

#### `roles.remove` (protected)
```typescript
Input: { id: string }
Returns: Role
```

### 3. Projects Router (`routers/projects.ts`)

#### `projects.list` (protected)
```typescript
Input: { search?: string, type?: 'general'|'website', roleId?: string }
Logic:
  - Filters by search term (name/description)
  - Filters by type and role
  - Orders by: pinned DESC, updatedAt DESC
Returns: Project[] (with role data)
```

#### `projects.get` (protected)
```typescript
Input: { id: string }
Returns: Project (with role)
```

#### `projects.create` (protected)
```typescript
Input: {
  name: string (min 2)
  type: 'general' | 'website'
  description?: string
  roleId?: string
  domain?: string // Website fields
  hostingProvider?: string
  dnsStatus?: string
  goLiveDate?: string
  repoUrl?: string
  stagingUrl?: string
}
Logic:
  1. Creates project
  2. Sets websiteStatus to 'discovery' for website projects
  3. Generates embedding for semantic search
  4. Logs activity
Returns: Project
```

#### `projects.update` (protected)
```typescript
Input: { id: string, ...updates }
Logic:
  1. Updates project fields
  2. Logs activity with changed fields
Returns: Project
```

#### `projects.remove` (protected)
```typescript
Input: { id: string }
Logic:
  1. Deletes project (cascades to tasks)
  2. Logs deletion
Returns: Project
```

#### `projects.convertToWebsite` (protected)
```typescript
Input: { id: string, website: { domain?, hostingProvider?, ...} }
Logic:
  1. Changes type to 'website'
  2. Sets websiteStatus to 'discovery'
  3. Updates website fields
Returns: { ok: true }
```

#### `projects.convertToGeneral` (protected)
```typescript
Input: { id: string }
Logic:
  1. Changes type to 'general'
  2. Clears website fields
Returns: { ok: true }
```

### 4. Tasks Router (`routers/tasks.ts`)

**Key Helper Function:**
```typescript
trackTaskTime(taskId, userId, oldStatus, newStatus)
  - When status → 'in_progress': Creates taskAnalytics with startedAt
  - When status → 'completed': Updates with completedAt & actualDurationMinutes
  - Used by AI to learn user patterns
```

#### `tasks.list` (protected)
```typescript
Input: {
  projectId?: string
  status?: TaskStatus
  roleId?: string
  dueWithinDays?: number
  isDailyOnly?: boolean
}
Logic:
  - Always excludes archived tasks
  - Filters by all provided criteria
  - Joins with projects, roles, tickets
Returns: Task[] (with project, role, ticket)
```

#### `tasks.create` (protected)
```typescript
Input: {
  projectId: string
  title: string (min 2)
  description?: string
  dueDate?: string | null
  isDaily?: boolean
  priorityScore?: '1'|'2'|'3'|'4'
  status?: TaskStatus
  roleId?: string
  subtasks?: Array<{ title, completed?, position? }>
}
Logic:
  1. Inherits roleId from project if not provided
  2. Creates task
  3. Creates subtasks if provided
  4. Generates embedding for search
  5. Logs activity
Returns: Task
```

#### `tasks.update` (protected)
```typescript
Input: { id: string, ...partial updates }
Logic:
  1. Gets current task state
  2. Updates task fields
  3. Calls trackTaskTime() if status changed
  4. Updates embedding
  5. Logs activity
Returns: Task
```

#### `tasks.reorder` (protected)
```typescript
Input: {
  projectId?: string
  orderedIdsByStatus: Record<status, taskId[]>
}
Logic: Updates status for each task in ordered lists
Returns: { success: true }
```

#### `tasks.setBlocked` (protected)
```typescript
Input: { id: string, reason: string, details?: string }
Logic:
  1. Sets status to 'blocked'
  2. Records reason, details, blockedAt
  3. Logs activity
Returns: Task
```

#### Subtask Operations
```typescript
tasks.addSubtask({ taskId, title })
tasks.updateSubtask({ id, title?, completed?, position? })
tasks.deleteSubtask({ id })
```

#### Quick Actions
```typescript
tasks.moveToToday({ id }) // Sets dueDate to today
tasks.moveToNoDue({ id }) // Clears dueDate, sets isDaily=true
tasks.moveToNextDays({ id, daysFromToday: 1-3 })
tasks.complete({ id }) // Marks completed + tracks time
tasks.snoozeDays({ id, days: 1-7 })
tasks.remove({ id })
```

#### `tasks.sync` (protected)
For offline-first sync.
```typescript
Input: {
  lastSyncAt?: number (timestamp)
  tasks: Array<{ id, projectId, title, status, updatedAt, ... }>
}
Logic:
  1. Fetches server tasks updated since lastSyncAt
  2. Compares timestamps
  3. Detects conflicts (both client & server modified)
  4. Applies client updates where client is newer
Returns: {
  serverTasks: Task[]
  conflicts: Conflict[]
  updatedCount: number
}
```

### 5. Search Router (`routers/search.ts`)

#### `search.query` (protected)
```typescript
Input: { q: string (min 2), topK?: number (default 10) }
Logic:
  1. Checks if OpenAI configured (returns [] if not)
  2. Generates embedding for query (text-embedding-3-small)
  3. Uses pgvector <-> operator for nearest embeddings
  4. Hydrates results from tasks/projects tables
Returns: Array<{
  kind: 'task' | 'project'
  item: Task | Project
  snippet: string
}>
```

### 6. Dashboard Router (`routers/dashboard.ts`)

#### `dashboard.get` (protected)
```typescript
Input: { roleId?: string }
Logic:
  1. Calculates today and next week dates
  2. Projects with counts:
     - Groups tasks by project
     - Counts total & completed (non-archived only)
     - Orders by pinned DESC, updatedAt DESC
  3. Today's tasks: Due today, not completed
  4. Overdue tasks: Due before today, not completed
  5. Upcoming tasks: Next 7 days (limit 5)
  6. All respect roleId filter
Returns: {
  projects: Array<{ ...project, totalTasks, completedTasks }>
  today: number
  overdue: number
  upcoming: Task[]
}
```

### 7. Notifications Router (`routers/notifications.ts`)

```typescript
notifications.list() // Returns all user notifications
notifications.markRead({ id })
notifications.markAllRead()
notifications.delete({ id })
```

### 8. Activity Router (`routers/activity.ts`)

```typescript
activity.list({ projectId?, taskId?, limit?: 50 })
activity.feed({ cursor?: string, limit?: 20 }) // Paginated
```

### 9. Chat Router (`routers/chat.ts`)

```typescript
chat.threads({ projectId?, taskId? })
chat.messages({ threadId, limit?: 50 })
chat.send({ threadId, content, messageType?, replyToId? })
chat.react({ messageId, emoji })
chat.createThread({ projectId, taskId?, title, description? })
```

### 10. Analytics Router (`routers/analytics.ts`)

```typescript
analytics.taskCompletion({ days?: 30 })
analytics.productivity({ days?: 30 })
analytics.projectStats({ projectId })
```

### 11. Realtime Router (`routers/realtime.ts`)

```typescript
realtime.presence({ projectId })
realtime.subscribe({ channels: string[] })
```

---

## 🤖 AI Features

### AI Modules

#### 1. Planning Engine (`lib/ai/planning-engine.ts`)

**Class: PlanningEngine**

Rate Limiting: Max 10 requests per user per hour

**`generateDailyPlan(userId, context)`**
Uses GPT-4 to create optimized daily schedules.

```typescript
Input: {
  userId: string
  context: {
    currentTime: Date
    tasks: Array<{ id, title, description, priority, status, dueDate, ... }>
    userPatterns?: ProductivityPattern
    workingHoursStart?: number (default 9)
    workingHoursEnd?: number (default 17)
  }
}

Returns: {
  plan: Array<{
    taskId: string
    order: number
    suggestedStartTime: string (e.g., "10:00")
    estimatedDuration: number (minutes)
    reasoning: string
  }>
  breaks: Array<{
    afterTask: string
    duration: number
    type: 'short_break' | 'lunch_break'
  }>
  deferredTasks: string[] // Tasks that don't fit today
  totalEstimatedMinutes: number
  risks: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    message: string
  }>
  summary: string
  confidence: number (0-1)
}
```

**`estimateTaskDuration(userId, taskTitle, taskDescription?, similarTasks?)`**
Uses GPT-3.5 for time estimation.

```typescript
Returns: {
  estimatedMinutes: number
  confidence: number (0-1)
  reasoning: string
}
```

**`suggestPriority(userId, task, otherTasks, currentDate)`**
Uses GPT-3.5 to suggest priority level.

```typescript
Returns: {
  suggestedPriority: '1' | '2' | '3' | '4'
  reasoning: string
  confidence: number (0-1)
}
```

**`generateContextualSuggestions(userId, context)`**
Uses GPT-3.5 for proactive suggestions.

```typescript
Input: {
  currentView: 'dashboard' | 'project' | 'daily'
  userActivity: string
  relevantTasks: Array<{ id, title, status, priority }>
  patterns?: ProductivityPattern
}

Returns: Array<{
  type: string (e.g., 'focus_block', 'overdue_warning')
  title: string
  message: string
  action?: { type, taskId?, ... }
  priority: 'low' | 'medium' | 'high'
}>
```

#### 2. Pattern Analyzer (`lib/ai/pattern-analyzer.ts`)

**Class: PatternAnalyzer**

**`analyzeUserPatterns(userId)`**
Comprehensive pattern analysis.

```typescript
Analyzes:
  - completionTimes: Avg duration by priority (from taskAnalytics)
  - productiveHours: Top 3 most productive hours (0-23)
  - taskCategoryDuration: Avg duration by role
  - postponementPattern: Rescheduling behavior (TODO)
  - velocity: {
      tasksPerDay: number
      tasksPerWeek: number
      trend: 'increasing' | 'stable' | 'decreasing'
    }
  - confidenceScore: 0-1 (based on data points)

Stores: Patterns saved to userPatterns table

Returns: ProductivityPattern
```

**`getStoredPatterns(userId)`**
Fetches previously analyzed patterns.

#### 3. Search: upsertEmbedding (`server/search/upsertEmbedding.ts`)

```typescript
Input: {
  entityType: 'task' | 'project'
  entityId: string
  text: string
}

Logic:
  1. Checks if OpenAI configured (skips if not)
  2. Generates embedding (text-embedding-3-small)
  3. Deletes existing embedding
  4. Inserts new embedding

Called automatically:
  - When task created/updated
  - When project created/updated
```

---

## 📡 REST API Routes

### AI Routes (`app/api/ai/`)

#### `POST /api/ai/daily-plan`
Generates AI daily plan.
```typescript
Auth: Required
Returns: { success: true, plan: DailyPlan, tasksAnalyzed: number }
```

#### `POST /api/ai/suggest`
Contextual AI suggestions.
```typescript
Auth: Required
Input: { currentView?, userActivity? }
Returns: { success: true, suggestions: ContextualSuggestion[] }
```

#### `POST /api/ai/daily-plan/accept`
Records user acceptance of AI plan.

#### `POST /api/ai/daily-summary`
End-of-day productivity summary.

### Support Routes (`app/api/support/`)

#### `POST /api/support/submit` (PUBLIC)
Customer ticket submission.
```typescript
Auth: None (public endpoint)
Input: FormData {
  customerName, customerEmail, projectName, domain?,
  details, priority?, files[]
}
Returns: { ok: true, id: string, aiEta: string }
```

#### `POST /api/support/ai/summarize-and-propose`
AI ticket analysis and task generation.
```typescript
Auth: Required
Input: { ticketId: string }

Logic:
  1. Fetches ticket details
  2. Gets historical project assignments
  3. AI Project Suggestion:
     - Historical assignments
     - Domain matching
     - Name matching
  4. GPT-4 generates:
     - Summary
     - 3-5 actionable tasks with estimates
     - Project suggestions
  5. Updates ticket with aiSummary

Returns: {
  summary: string
  tasks: Array<{ id, title, description, projectId?, estimatedHours }>
  suggestedProject: { id, name, reason } | null
  availableProjects: Array<{ id, name }>
}
```

#### `POST /api/support/tasks/accept`
Creates tasks from AI proposal.

#### `POST /api/support/check-completion`
Checks if all ticket tasks completed.

### Notes Routes (`app/api/notes/`)

#### `POST /api/notes/create`
Creates text or audio note.

#### `POST /api/notes/ai/generate-tasks`
AI task generation from notes.
```typescript
Auth: Required
Input: { noteId: string }

Logic:
  1. Fetches note content
  2. GPT-4 analyzes and generates 3-5 tasks
  3. Returns tasks for review

Returns: {
  summary: string
  tasks: Array<{ id, title, description, projectId, estimatedHours }>
}
```

#### `POST /api/notes/transcribe`
Audio transcription (OpenAI Whisper).

### Sync Routes (`app/api/sync/`)

#### `POST /api/sync/push`
Pushes local changes to server.

#### `GET /api/sync/pull`
Pulls server changes since last sync.

#### `POST /api/sync/resolve-conflict`
Resolves sync conflicts.

---

## 🎨 Component Architecture

### Page Structure

#### Protected App Pages (`app/(app)/`)

**dashboard/page.tsx**
- Today's tasks count
- Overdue tasks count
- Project tiles (with pin/unpin)
- Upcoming tasks (next 7 days)
- Role filter
- Search affordance (⌘K)

**board/page.tsx**
- Kanban board with drag-and-drop
- Task search
- Project filter
- Task creation

**daily/page.tsx**
- Today's tasks
- Daily planner
- AI suggestions
- Quick actions (snooze, complete, reschedule)

**projects/page.tsx**
- All projects list
- Create new project
- Filter by type/role
- Search projects

**projects/[id]/page.tsx**
- Project details
- Project tasks
- Project-specific Kanban
- Notes
- Website fields (if website type)

**tickets/page.tsx**
- Support tickets list
- AI task generation
- Reply system

**notes/page.tsx**
- Notes list
- Create text/audio notes
- AI task generation
- Audio transcription

**activity/page.tsx**
- Activity feed
- Infinite scroll
- Filter by project/task

**chat/page.tsx**
- Chat threads
- Real-time messaging
- Reactions
- Mentions

**completed/page.tsx**
- Completed tasks archive
- Search & restore

**settings/page.tsx**
- Roles management (CRUD)
- Profile information (name, email) - **UI only, TODO API**
- Password change - **UI only, TODO API**
- **Logout button** - In sidebar

#### Auth Pages (`app/(auth)/`)

**sign-in/page.tsx** - Email/password login  
**sign-up/page.tsx** - User registration

#### Public Pages

**support/page.tsx** - Public ticket submission

### Key Components

#### Kanban (`components/kanban/`)

**KanbanBoard.tsx** - Main board with @dnd-kit drag-and-drop  
**KanbanColumn.tsx** - Status columns  
**KanbanTask.tsx** - Draggable task cards  
**KanbanFilters.tsx** - Filter controls

#### Tasks (`components/tasks/`)

**TaskCard.tsx** - Compact task preview  
**TaskCreateModal.tsx** - Task creation form  
**TaskDetailsModal.tsx** - Full task view  
**SubtaskList.tsx** - Checklist UI

#### Projects (`components/projects/`)

**ProjectTile.tsx** - Project card with progress  
**ProjectCreateModal.tsx** - Create/edit form  
**ProjectDetailsModal.tsx** - Full project view  
**WebsiteProjectForm.tsx** - Website-specific fields

#### Dashboard (`components/dashboard/`)

**ProjectTile.tsx** - Dashboard project cards  
**RoleFilter.tsx** - Role filter pills  
**EmptyProjects.tsx** - Empty state

#### AI (`components/ai/`)

**DailyPlanSuggestions.tsx** - AI daily plan display  
**SuggestionCard.tsx** - Individual suggestion  
**PlanActionBar.tsx** - Accept/reject AI plan

#### Layout (`components/layout/`)

**app-layout.tsx** - Main app shell  
**sidebar.tsx** - Navigation + **Logout button**  
**topbar.tsx** - Search, notifications, new task  
**page-header.tsx** - Reusable page header

#### Search (`components/search/`)

**CommandPalette.tsx** - Global search (⌘K)

#### Notifications (`components/notifications/`)

**NotificationBell.tsx** - Bell with unread count  
**NotificationPanel.tsx** - Full notifications view

#### Sync (`components/sync/`)

**SyncIndicator.tsx** - Sync status display  
**ConflictResolver.tsx** - Conflict resolution UI  
**OfflineIndicator.tsx** - Offline banner

---

## 🔄 Key User Flows

### Creating a Task

1. User clicks "New Task" → Opens TaskCreateModal
2. User fills form (title, project, due date, priority, subtasks)
3. Form validates with Zod
4. Calls `trpc.tasks.create.mutate()`
5. Server creates task, subtasks, generates embedding, logs activity
6. TanStack Query updates cache
7. Task appears in relevant views

### AI Daily Plan

1. User navigates to Daily Planner
2. Clicks "Generate AI Plan"
3. Server fetches user patterns (or analyzes if none exist)
4. Calls `planningEngine.generateDailyPlan()` with tasks & patterns
5. GPT-4 returns structured plan with ordered tasks, breaks, risks
6. Client displays plan in DailyPlanSuggestions
7. User accepts → Stores in aiSuggestions, applies recommendations
8. AI learns from acceptance

### Support Ticket with AI

1. Customer submits ticket (public form) → Creates ticket
2. Admin views ticket → Clicks "AI Analyze"
3. Server fetches ticket, customer history, projects
4. AI suggests project based on history/domain/name
5. GPT-4 generates summary and 3-5 tasks with estimates
6. Admin reviews, edits, accepts tasks
7. Tasks created and linked to ticket
8. Auto-completion check when tasks done

### Semantic Search

1. User presses ⌘K → Opens CommandPalette
2. User types "fix bug"
3. Generates query embedding (text-embedding-3-small)
4. pgvector finds nearest embeddings
5. Hydrates results from tasks/projects
6. Displays grouped results with snippets

### Offline Sync

1. User goes offline → Switches to Dexie (IndexedDB)
2. User creates task → Saved locally with pending flag
3. User goes online → Calls `/api/sync/push`
4. Server detects conflicts (timestamp comparison)
5. Client shows ConflictResolver if needed
6. User resolves → Calls `/api/sync/resolve-conflict`
7. Sync complete

---

## 🔐 Security Features

- **Authentication:** NextAuth with JWT sessions
- **Password Hashing:** bcrypt (12 rounds)
- **Row-Level Security:** All queries filter by userId
- **SQL Injection:** Protected by Drizzle ORM
- **XSS:** React auto-escapes
- **CSRF:** SameSite cookies
- **API Protection:** All tRPC procedures require auth (except auth routes)
- **File Uploads:** Type/size validation, Vercel Blob storage
- **Secrets:** Server-only, never sent to client

---

## 🚀 Deployment

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/db"

# Auth
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="<public anon key>"
SUPABASE_SERVICE_ROLE_KEY="<service role key - SERVER ONLY>"

# Vercel (file uploads)
BLOB_READ_WRITE_TOKEN="<Vercel Blob token>"
```

### Database Setup

```bash
# 1. Enable pgvector
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 2. Generate migrations
pnpm db:generate

# 3. Run migrations
pnpm db:migrate

# 4. (Optional) Seed data
pnpm db:seed
```

### Local Development

```bash
pnpm install
pnpm dev
```

### Vercel Deployment

1. Connect repo to Vercel
2. Set environment variables
3. Deploy automatically on push

---

## 📦 File Structure

```
project-tracker-ai/
├── public/                 # Static assets
│   ├── icons/             # PWA icons
│   ├── manifest.json      # PWA manifest
│   └── service-worker.js
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (app)/        # Protected app pages
│   │   ├── (auth)/       # Auth pages
│   │   ├── api/          # API routes
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Landing page
│   ├── components/       # React components
│   │   ├── kanban/       # Kanban board
│   │   ├── tasks/        # Task components
│   │   ├── projects/     # Project components
│   │   ├── dashboard/    # Dashboard
│   │   ├── ai/           # AI components
│   │   ├── layout/       # Layout (sidebar, topbar)
│   │   ├── search/       # Command palette
│   │   ├── sync/         # Offline sync
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   │   └── ai/          # AI modules
│   ├── server/           # Server-side code
│   │   ├── auth/        # Auth config
│   │   ├── db/          # Database
│   │   │   ├── schema/  # Table schemas
│   │   │   └── migrations/
│   │   ├── search/      # Search utilities
│   │   └── trpc/        # tRPC routers
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
├── scripts/              # Utility scripts
├── drizzle.config.ts     # Drizzle config
├── next.config.js        # Next.js config
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## ✨ Key Features Summary

### Core Task Management
✅ Full CRUD for tasks with subtasks  
✅ Multiple status types (9 statuses)  
✅ Priority levels (P1-P4)  
✅ Due dates & daily planner  
✅ Archive & block tasks  
✅ Drag-and-drop Kanban

### Project Management
✅ General & website project types  
✅ Website-specific fields  
✅ Role-based organization  
✅ Pin/unpin projects  
✅ Progress tracking

### AI-Powered Features
✅ Daily task planning (GPT-4)  
✅ Task duration estimation (GPT-3.5)  
✅ Priority suggestions (GPT-3.5)  
✅ Contextual suggestions (GPT-3.5)  
✅ Ticket summarization (GPT-4)  
✅ Task generation from tickets (GPT-4)  
✅ Task generation from notes (GPT-4)  
✅ Semantic search (embeddings + pgvector)  
✅ Productivity pattern learning  
✅ User velocity tracking

### Support Ticket System
✅ Public ticket submission  
✅ File attachments (Vercel Blob)  
✅ AI ticket analysis  
✅ Automatic project matching  
✅ AI task generation  
✅ Reply system  
✅ Auto-completion detection

### Collaboration
✅ Real-time presence  
✅ Chat threads  
✅ Message reactions  
✅ Mentions  
✅ Activity feed  
✅ Notifications

### Advanced Features
✅ Offline-first sync (Dexie + IndexedDB)  
✅ Conflict resolution  
✅ Progressive Web App (PWA)  
✅ Search (⌘K command palette)  
✅ Drag-and-drop file uploads  
✅ Role-based filtering  
✅ Analytics & insights

### Developer Experience
✅ End-to-end type safety (tRPC)  
✅ Type-safe database (Drizzle ORM)  
✅ Automatic cache management  
✅ Optimistic updates  
✅ Error boundaries  
✅ Form validation (Zod)

---

## 🐛 Known TODOs

### Settings Page
- **Profile Update API** - UI exists but backend not implemented (line 538)
- **Password Change API** - UI exists but backend not implemented (line 610)
- **Phone Field** - Not currently in schema or UI

### Suggested Implementations

```typescript
// Add to src/server/trpc/routers/auth.ts

updateProfile: protectedProcedure
  .input(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const [updated] = await ctx.db
      .update(users)
      .set({
        name: input.name,
        email: input.email,
        // phone: input.phone, // Add to schema first
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.session.user.id))
      .returning();
    return updated;
  }),

changePassword: protectedProcedure
  .input(z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Fetch user with password
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);
    
    // 2. Verify current password
    const isValid = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash
    );
    
    if (!isValid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect',
      });
    }
    
    // 3. Hash new password
    const newHash = await bcrypt.hash(input.newPassword, 12);
    
    // 4. Update database
    await ctx.db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.session.user.id));
    
    return { success: true };
  }),
```

---

## 📊 Data Flow Diagram

```
User → Next.js Client (React)
  ↓
TanStack Query (cache)
  ↓
tRPC Client
  ↓
HTTP/WebSocket
  ↓
Next.js API (tRPC Server)
  ↓
Drizzle ORM
  ↓
PostgreSQL (Supabase)

AI Flow:
User → API Route
  ↓
OpenAI API (GPT-4 / GPT-3.5 / Embeddings)
  ↓
Response → Database
  ↓
Client Cache Update
  ↓
UI Update

Offline Flow:
User (offline) → Dexie (IndexedDB)
  ↓
[User goes online]
  ↓
Sync API → Server
  ↓
Conflict Detection → Resolution
  ↓
Database Update
  ↓
Client Cache Sync
```

---

## 🎯 Conclusion

This is a **production-grade, full-stack application** with:
- **Type-safe** end-to-end architecture
- **AI-powered** intelligent features
- **Offline-first** with sync & conflict resolution
- **Real-time** collaboration capabilities
- **Scalable** architecture with modern best practices
- **Modern UX** with animations and PWA support

Perfect for rebuilding as a reference implementation or extending with new features.

---

**Document Version:** 1.0  
**Generated:** October 29, 2025  
**Maintainers:** Development Team

