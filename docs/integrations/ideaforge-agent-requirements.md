# IdeaForge Agent Requirements (Project Tracker Integration)

This document enumerates everything the IdeaForge agent needs to build IdeaForge and connect it to the Project Tracker app.

## 1) Integration Goals

- Push IdeaForge plans/tasks into Project Tracker (Pattern4-aware).
- Receive execution changes (status, due dates, notes) back into IdeaForge.
- Preserve source-of-truth boundaries:
  - IdeaForge: ideas, plans, task definitions.
  - Project Tracker: execution state and append-only notes.

## 2) Authentication & Security

- Use **server-to-server** API key auth (no client usage).
- Include `Authorization: Bearer <integration_key>` on all requests.
- Keys are stored hashed in Project Tracker (`integration_api_keys`).
- Webhooks are HMAC-signed with `IDEAFORGE_WEBHOOK_SECRET`.
- All write/sensitive endpoints are rate-limited (per-IP + per-key).

**Required env vars (Project Tracker):**

- `IDEAFORGE_WEBHOOK_URL`
- `IDEAFORGE_WEBHOOK_SECRET`

**Required secrets (IdeaForge backend):**

- `PROJECT_TRACKER_INTEGRATION_KEY`
- `PROJECT_TRACKER_BASE_URL`
- `PROJECT_TRACKER_WEBHOOK_SECRET` (must match Project Tracker)

**API key hashing (IdeaForge/ops):**

- Generate a long random key (32+ bytes).
- Hash with SHA-256 and store the hash in Project Tracker.
- Use raw key only in IdeaForge backend env.

Example hash (Node.js):

```ts
import { createHash, randomBytes } from 'crypto';

const raw = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(raw).digest('hex');
console.log({ raw, hash });
```

## 3) Pattern4 Coverage (Full Surface Area)

IdeaForge must support all Pattern4 CRUD + lifecycle + stats:

### Sprints

- Create/update/list/get/delete
- Mark sprint complete (set `isActive=false`)
- Generate 13-week cadence (bulk create weeks)

### Weeks

- Create/update/list/get/delete (scoped to sprint)

### Opportunities

- Create/update/list/get/delete
- Complete opportunity with performance fields:
  - `actualCost`, `revenue`, `profit`, `decision`, `outcomeNotes`
- Kill opportunity with `outcomeNotes`

**Enums to support:**

- Opportunity status: `IDEA`, `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `KILLED`
- Opportunity type: `MAJOR`, `MICRO`
- Decision: `KEEP`, `ADJUST`, `CANCEL`, `UNDECIDED`

### Stats

- Sprint progress: total tasks, completed tasks, completion percentage
- Week progress: total tasks, completed tasks, completion percentage
- Opportunity progress: task counts + budget totals

## 4) Task Sync Requirements

### Push (IdeaForge → Project Tracker)

IdeaForge must send **plan tasks** with Pattern4 linkage:

- `ideaId`
- `planVersion`
- `planTaskId`
- `title`, `description`
- `priority` (1–4)
- `dueDate` (ISO date string)
- `sprintId`, `sprintWeekId`, `opportunityId`
- `budgetPlanned`
- `projectId` (optional) or `projectName` fallback

Project Tracker creates/updates tasks and returns mappings.

### Pull (Project Tracker → IdeaForge)

IdeaForge must poll changes since a timestamp:

- Task status changes
- Due date changes
- Notes added (append-only)

**Task status enum (Project Tracker):**

- `not_started`, `in_progress`, `blocked`, `completed`, `content`, `design`, `dev`, `qa`, `launch`

**Priority:**

- `priority` (1-4) mapped to `priorityScore` (`'1' | '2' | '3' | '4'`)

**Due date format:**

- Send/receive ISO date-only string `YYYY-MM-DD`

## 5) Integration Endpoints (Detailed)

Base URL: `PROJECT_TRACKER_BASE_URL`

**Reference assets:**

- OpenAPI spec: `docs/integrations/ideaforge-openapi.yaml`
- Postman collection: `docs/integrations/ideaforge.postman.json`
- Sample client: `docs/integrations/ideaforge-client.ts`
- Key generator: `docs/integrations/ideaforge-keygen.ts`
- Webhook handler example: `docs/integrations/ideaforge-webhook-handler.ts`
- Smoke tests: `docs/integrations/ideaforge-smoke-tests.ts`

### Pattern4

**Create sprint**
`POST /api/ideaforge/pattern4/sprints`

Payload:
```
{
  "name": "Q1 Sprint",
  "startDate": "2026-01-01",
  "endDate": "2026-03-31",
  "goalSummary": "High-level objective"
}
```

Response:
```
{ "sprint": { "id": "...", "isActive": true, ... } }
```

**Complete sprint**
`POST /api/ideaforge/pattern4/sprints/:id/complete`

**Generate weeks**
`POST /api/ideaforge/pattern4/weeks/generate`

Payload:
```
{ "sprintId": "uuid" }
```

Response:
```
{ "weeks": [ { "weekIndex": 1, "startDate": "...", "endDate": "..." }, ... ] }
```

**Create opportunity**
`POST /api/ideaforge/pattern4/opportunities`

Payload:
```
{
  "name": "Launch micro-product",
  "type": "MICRO",
  "sprintId": "uuid",
  "lane": "Marketing",
  "summary": "One-liner",
  "estimatedCost": "1500",
  "priority": 2
}
```

**Complete opportunity**
`POST /api/ideaforge/pattern4/opportunities/:id/complete`

Payload:
```
{
  "actualCost": "1800",
  "revenue": "4200",
  "profit": "2400",
  "decision": "KEEP",
  "outcomeNotes": "Strong signal, continue"
}
```

**Kill opportunity**
`POST /api/ideaforge/pattern4/opportunities/:id/kill`

Payload:
```
{ "outcomeNotes": "Too risky after validation" }
```

### Task sync

**Upsert plan tasks**
`POST /api/ideaforge/tasks/sync`

Payload:
```
{
  "ideaId": "idea_123",
  "planVersion": "v3",
  "tasks": [
    {
      "planTaskId": "task_1",
      "title": "Design landing page",
      "description": "Draft hero + CTA",
      "priority": 2,
      "dueDate": "2026-02-01",
      "sprintId": "uuid",
      "sprintWeekId": "uuid",
      "opportunityId": "uuid",
      "budgetPlanned": "500",
      "projectName": "IdeaForge"
    }
  ]
}
```

Response:
```
{
  "ideaId": "idea_123",
  "planVersion": "v3",
  "mappedTasks": [
    { "planTaskId": "task_1", "taskId": "uuid", "created": true }
  ],
  "syncedAt": "ISO-8601"
}
```

**Changes feed**
`GET /api/ideaforge/tasks/changes?since=2026-01-31T12:00:00.000Z`

Response:
```
{
  "tasks": [
    {
      "taskId": "uuid",
      "planTaskId": "task_1",
      "ideaId": "idea_123",
      "planVersion": "v3",
      "status": "completed",
      "dueDate": "2026-02-01",
      "updatedAt": "ISO-8601"
    }
  ],
  "notes": [
    {
      "commentId": "uuid",
      "taskId": "uuid",
      "planTaskId": "task_1",
      "ideaId": "idea_123",
      "planVersion": "v3",
      "content": "Done, shipped",
      "source": "app",
      "createdAt": "ISO-8601"
    }
  ],
  "serverTime": "ISO-8601"
}
```

**Append-only note**
`POST /api/ideaforge/tasks/:id/notes`

Payload:
```
{
  "content": "IdeaForge note text",
  "contentHtml": "<p>Optional HTML</p>"
}
```

Note: `:id` can be Project Tracker `taskId` or IdeaForge `planTaskId`.

## 6) Webhook Contract (Project Tracker → IdeaForge)

**Headers**
```
X-IdeaForge-Signature: <sha256 hmac of raw body>
```

**Events**

- `task.status_changed`
- `task.due_date_changed`
- `task.note_added`
- `task.updated`

**Payload**
```
{
  "type": "task.status_changed",
  "ideaId": "idea_123",
  "planVersion": "v3",
  "planTaskId": "task_1",
  "taskId": "uuid",
  "occurredAt": "ISO-8601",
  "data": { ... }
}
```

**Verification (Node.js)**
```ts
import { createHmac } from 'crypto';

const rawBody = req.rawBody; // must be the raw request body
const signature = req.headers['x-ideaforge-signature'];
const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
if (signature !== expected) throw new Error('Invalid signature');
```

## 7) Data Mapping & Storage

**Mapping record** (Project Tracker `ideaforge_sync_map`):

- `idea_id`, `plan_version`, `plan_task_id`
- `task_id`, `project_id`
- `sprint_id`, `sprint_week_id`, `opportunity_id`
- `last_sync_at`, `last_change_source`

**Notes**

- Task notes are stored in `task_comments`.
- `source` is `ideaforge` when note was created by IdeaForge.
- `source` is `app` when created in Project Tracker UI.

## 8) Conflict & Source-of-Truth Rules

- **IdeaForge** owns task definition fields:
  - title, description, priority, Pattern4 linkage, budgetPlanned
- **Project Tracker** owns execution fields:
  - status, dueDate changes made in Tracker, notes, timestamps
- Conflict policy: last-write wins for execution fields; IdeaForge does not overwrite status.
- Append-only notes; never delete or edit from IdeaForge.

## 9) Rate Limits & Retries

- Burst: 20 requests per 10 seconds
- Sustained: 100 requests per 10 minutes
- On `429`, backoff with jitter (e.g., 2s, 4s, 8s, max 60s).

## 10) Error Handling Requirements

- Handle `401` (invalid/missing key) → trigger ops alert.
- Handle `404` for sprint/week/opportunity/task mapping mismatch.
- Handle `409` on week generation if weeks already exist.
- Treat `5xx` as transient and retry with exponential backoff.

## 11) Required IdeaForge Flows

**Commit flow → Project Tracker**

1) Freeze idea state.
2) Generate plan + tasks.
3) Create/attach Pattern4 sprint/week/opportunity (if chosen).
4) Push tasks to Project Tracker.
5) Store returned mapping for each plan task.

**Execution sync flow**

- Subscribe to webhooks for near-real-time updates.
- Poll `/tasks/changes` as fallback.
- Update IdeaForge tasks and milestone progress.

## 12) Optional Enhancements (Recommended)

- Local cache of task mappings (ideaId + planTaskId → taskId).
- Reconciliation job: periodic diff of tasks/notes for missed updates.
- Metrics/alerts: webhook failure rate, latency, backoff counts.

