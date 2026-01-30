 # IdeaForge ↔ Project Tracker Integration Handoff Packet
 
 This document is a complete, end-to-end handoff for building the IdeaForge app against the Project Tracker integration. It consolidates the requirements, contracts, examples, and operational details from all integration documents.
 
 ---
 
 ## 1) Purpose and Goals
 
 **Primary goals**
 - Push IdeaForge plans and tasks into Project Tracker (Pattern4-aware).
 - Receive execution changes (status, due dates, notes) back into IdeaForge.
 - Preserve source-of-truth boundaries:
   - IdeaForge owns idea content, plan structure, and task definitions.
   - Project Tracker owns execution state and append-only notes.
 
 **Integration direction**
 - IdeaForge → Project Tracker: plan tasks, Pattern4 entities.
 - Project Tracker → IdeaForge: webhook events + changes feed for execution updates.
 
 ---
 
 ## 2) Security, Auth, and Required Secrets
 
 **Authentication**
 - Server-to-server API key auth only.
 - All requests must include `Authorization: Bearer <integration_key>`.
 - Project Tracker stores **hashed** keys in `integration_api_keys`.
 - IdeaForge must store the **raw key** (never the hash).
 
 **Rate limits**
 - Burst: 20 requests per 10 seconds
 - Sustained: 100 requests per 10 minutes
 - On `429`, backoff with jitter (2s, 4s, 8s, max 60s).
 
 **Required env vars (Project Tracker)**
 - `IDEAFORGE_WEBHOOK_URL`  
   URL for IdeaForge to receive webhook events from Project Tracker.
 - `IDEAFORGE_WEBHOOK_SECRET`  
   HMAC secret used to sign outgoing webhooks.
 
 **Required secrets (IdeaForge backend)**
 - `PROJECT_TRACKER_BASE_URL` (Project Tracker API base)
 - `PROJECT_TRACKER_INTEGRATION_KEY` (raw API key)
 - `PROJECT_TRACKER_WEBHOOK_SECRET` (must match `IDEAFORGE_WEBHOOK_SECRET`)
 
 **Webhook signature**
 - Header: `X-IdeaForge-Signature`
 - Value: `sha256 hmac` of raw request body using `IDEAFORGE_WEBHOOK_SECRET`
 
 ---
 
 ## 3) Assets and References (Required Reading)
 
 **Human-readable contract**
 - `docs/integrations/ideaforge.md`
 
 **OpenAPI spec (machine-readable)**
 - `docs/integrations/ideaforge-openapi.yaml`
 
 **Postman collection**
 - `docs/integrations/ideaforge.postman.json`
 
 **Client example**
 - `docs/integrations/ideaforge-client.ts`
 
 **Webhook handler example**
 - `docs/integrations/ideaforge-webhook-handler.ts`
 
 **Smoke tests**
 - `docs/integrations/ideaforge-smoke-tests.ts`
 
 **Key generation helper**
 - `docs/integrations/ideaforge-keygen.ts`
 
 ---
 
 ## 4) API Base URL and Headers
 
 **Base URL**
 - `PROJECT_TRACKER_BASE_URL` (example: `https://your-project-tracker.com`)
 
 **Required headers**
 - `Authorization: Bearer <integration_key>`
 - `Content-Type: application/json` (for POST/PATCH)
 
 ---
 
 ## 5) Pattern4 Endpoints (Full Coverage Required)
 
 IdeaForge must support **all** Pattern4 endpoints.
 
 **Sprints**
 - `GET /api/ideaforge/pattern4/sprints`
 - `POST /api/ideaforge/pattern4/sprints`
 - `GET /api/ideaforge/pattern4/sprints/:id`
 - `PATCH /api/ideaforge/pattern4/sprints/:id`
 - `DELETE /api/ideaforge/pattern4/sprints/:id`
 - `POST /api/ideaforge/pattern4/sprints/:id/complete` (sets `isActive=false`)
 
 **Weeks**
 - `GET /api/ideaforge/pattern4/weeks?sprintId=`
 - `POST /api/ideaforge/pattern4/weeks`
 - `PATCH /api/ideaforge/pattern4/weeks/:id`
 - `DELETE /api/ideaforge/pattern4/weeks/:id`
 - `POST /api/ideaforge/pattern4/weeks/generate` (bulk 13-week cadence)
 
 **Opportunities**
 - `GET /api/ideaforge/pattern4/opportunities?status=&sprintId=`
 - `POST /api/ideaforge/pattern4/opportunities`
 - `GET /api/ideaforge/pattern4/opportunities/:id`
 - `PATCH /api/ideaforge/pattern4/opportunities/:id`
 - `DELETE /api/ideaforge/pattern4/opportunities/:id`
 - `POST /api/ideaforge/pattern4/opportunities/:id/complete`
 - `POST /api/ideaforge/pattern4/opportunities/:id/kill`
 
 **Stats**
 - `GET /api/ideaforge/pattern4/stats/sprint/:id`
 - `GET /api/ideaforge/pattern4/stats/week/:id`
 - `GET /api/ideaforge/pattern4/stats/opportunity/:id`
 
 **Enums to support**
 - Opportunity status: `IDEA`, `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `KILLED`
 - Opportunity type: `MAJOR`, `MICRO`
 - Decision: `KEEP`, `ADJUST`, `CANCEL`, `UNDECIDED`
 
 ---
 
 ## 6) Task Sync (Two-Way)
 
 **Push (IdeaForge → Project Tracker)**
 - Endpoint: `POST /api/ideaforge/tasks/sync`
 - Required fields:
   - `ideaId`, `planVersion`
   - `tasks[]` with:
     - `planTaskId` (string)
     - `title` (string)
     - `description` (optional)
     - `priority` (1–4)
     - `dueDate` (ISO date-only `YYYY-MM-DD`)
     - Pattern4 linkage: `sprintId`, `sprintWeekId`, `opportunityId`
     - `budgetPlanned`
     - `projectId` (optional) or `projectName` fallback
 
 **Pull (Project Tracker → IdeaForge)**
 - Endpoint: `GET /api/ideaforge/tasks/changes?since=<ISO>`
 - Returns:
   - Task status updates
   - Due date changes
   - Append-only notes
 
 **Task status enum**
 - `not_started`, `in_progress`, `blocked`, `completed`, `content`, `design`, `dev`, `qa`, `launch`
 
 **Priority mapping**
 - IdeaForge `priority` (1–4) maps to Tracker `priorityScore` (`'1'|'2'|'3'|'4'`)
 
 **Append-only note**
 - Endpoint: `POST /api/ideaforge/tasks/:id/notes`
 - `:id` can be Project Tracker `taskId` or IdeaForge `planTaskId`
 - Notes are **append-only** and stored as `task_comments` with `source='ideaforge'`
 
 ---
 
 ## 7) Webhook Contract (Project Tracker → IdeaForge)
 
 **Headers**
 - `X-IdeaForge-Signature: <sha256 hmac of raw body>`
 
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
 
**Verification (Node.js example)**
 ```
 import { createHmac } from 'crypto';
 
 const rawBody = req.rawBody;
 const signature = req.headers['x-ideaforge-signature'];
 const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
 if (signature !== expected) throw new Error('Invalid signature');
 ```

**Timing-safe compare (recommended)**
```
import { createHmac, timingSafeEqual } from 'crypto';

const rawBody = req.rawBody;
const signature = req.headers['x-ideaforge-signature'] ?? '';
const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

if (signature.length !== expected.length) throw new Error('Invalid signature');
const ok = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
if (!ok) throw new Error('Invalid signature');
```
 
 **Webhook endpoint requirement**
 - IdeaForge must expose a stable endpoint (e.g., `/api/webhooks/project-tracker`)
 - This URL becomes `IDEAFORGE_WEBHOOK_URL` on Project Tracker
 - The secret used to verify signatures becomes `IDEAFORGE_WEBHOOK_SECRET` on Project Tracker
 
 ---
 
 ## 8) Data Mapping and Storage
 
 **Mapping table (Project Tracker)**
 - `ideaforge_sync_map`:
   - `idea_id`, `plan_version`, `plan_task_id`
   - `task_id`, `project_id`
   - `sprint_id`, `sprint_week_id`, `opportunity_id`
   - `last_sync_at`, `last_change_source`
 
 **Notes**
 - Task notes are stored in `task_comments`.
 - `source` is `ideaforge` for IdeaForge-created notes.
 - `source` is `app` for Project Tracker UI notes.
 
 ---
 
 ## 9) Source-of-Truth and Conflict Rules
 
 **IdeaForge owns**
 - Task definition fields: `title`, `description`, `priority`, Pattern4 linkage, `budgetPlanned`
 
 **Project Tracker owns**
 - Execution fields: `status`, due date changes in Tracker, notes, timestamps
 
 **Conflict policy**
 - Last-write-wins for execution fields
 - IdeaForge does **not** overwrite status
 - Notes are append-only; do not delete/edit from IdeaForge

**Due date ownership rule (IdeaForge side)**
- IdeaForge may set the initial `dueDate`.
- If Project Tracker changes `dueDate`, IdeaForge must treat it as authoritative.
- Implement: when a tracker change is received, set `task.dueDateSource = 'tracker'`.
- While `dueDateSource === 'tracker'`, IdeaForge must not overwrite `dueDate` unless a user explicitly resets it in IdeaForge (which flips the source back to `'ideaforge'`).
 
 ---
 
 ## 10) Error Handling and Retries
 
 - `401 Unauthorized`: invalid/missing key → trigger ops alert
 - `404 Not Found`: mapping mismatch or missing entity
 - `409 Conflict`: week generation already exists
 - `5xx`: transient → retry with exponential backoff
 
 ---
 
 ## 11) Required IdeaForge Flows
 
 **Commit flow (IdeaForge → Project Tracker)**
 1. Freeze idea state.
 2. Generate plan and tasks.
 3. Create/attach Pattern4 sprint/week/opportunity (if chosen).
 4. Push tasks to Project Tracker.
 5. Store returned mappings (planTaskId → taskId).
 
 **Execution sync flow**
 - Subscribe to webhooks for near-real-time updates.
 - Poll `/tasks/changes` as fallback (or for reconciliation).
 - Update IdeaForge tasks and progress.
 
 ---
 
 ## 12) Example Requests (from docs)
 
 **Create sprint**
 ```
 POST /api/ideaforge/pattern4/sprints
 {
   "name": "Q1 Sprint",
   "startDate": "2026-01-01",
   "endDate": "2026-03-31",
   "goalSummary": "High-level objective"
 }
 ```
 
 **Generate weeks**
 ```
 POST /api/ideaforge/pattern4/weeks/generate
 { "sprintId": "uuid" }
 ```
 
 **Create opportunity**
 ```
 POST /api/ideaforge/pattern4/opportunities
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
 ```
 POST /api/ideaforge/pattern4/opportunities/:id/complete
 {
   "actualCost": "1800",
   "revenue": "4200",
   "profit": "2400",
   "decision": "KEEP",
   "outcomeNotes": "Strong signal, continue"
 }
 ```
 
 **Task sync**
 ```
 POST /api/ideaforge/tasks/sync
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
 
 **Changes feed**
 ```
 GET /api/ideaforge/tasks/changes?since=2026-01-31T12:00:00.000Z
 ```
 
 **Append-only note**
 ```
 POST /api/ideaforge/tasks/:id/notes
 {
   "content": "IdeaForge note text",
   "contentHtml": "<p>Optional HTML</p>"
 }
 ```
 
 ---
 
## 12.1) Contract Enhancement Suggestions (Recommended)

These are optional but strongly recommended to reduce ambiguity and improve idempotency.

**A) Add `eventId` to webhook payload**
- Current idempotency can be derived from `(type, taskId, occurredAt)`.
- A dedicated `eventId` avoids hash collisions and simplifies de-dupe logic.

**B) Include `changedFields` on `task.updated` webhook**
- Provide `changedFields: string[]` in `data` so IdeaForge does not diff payloads.

**C) Return mappings explicitly from `/tasks/sync`**
- Current response returns `mappedTasks`:
  - `{ planTaskId, taskId, created }`
- Suggested enhancement: include `projectId` and/or a separate `mappings` list:
  - `mappings: [{ planTaskId, taskId, projectId }]`
- If updated, reflect the change in the OpenAPI spec and sample responses.

---

 ## 13) Smoke Test Script (Quick Validation)
 
 - `docs/integrations/ideaforge-smoke-tests.ts` runs:
   - create sprint
   - generate weeks
   - create opportunity
   - sync tasks
   - add note
   - read changes
 
 **Required env**
 - `PROJECT_TRACKER_BASE_URL`
 - `PROJECT_TRACKER_INTEGRATION_KEY`
 
 ---
 
 ## 14) Key Generation (Ops Flow)
 
 **Helper**
 - `docs/integrations/ideaforge-keygen.ts`
 
 **Example**
 ```
 import { createHash, randomBytes } from 'crypto';
 
 const raw = randomBytes(32).toString('hex');
 const hash = createHash('sha256').update(raw).digest('hex');
 console.log({ raw, hash });
 ```
 
 **SQL insert**
 ```
 INSERT INTO integration_api_keys (id, user_id, name, integration, key_hash)
 VALUES (gen_random_uuid(), '<USER_ID>', 'IdeaForge', 'ideaforge', '<KEY_HASH>');
 ```
 
 **Never share**
 - DB credentials
 - Key hashes
 
 **Always share**
 - Raw integration key to IdeaForge backend only

---

## 15) Agent Requested Inputs (Provide to IdeaForge Agent)

**Provide these directly to the IdeaForge agent (copy/paste or attach):**
- OpenAPI spec contents:
  - `docs/integrations/ideaforge-openapi.yaml`
- Example response payloads for:
  - `POST /api/ideaforge/tasks/sync`
  - `GET /api/ideaforge/tasks/changes`
  - each webhook event `data` object (`task.status_changed`, `task.due_date_changed`, `task.note_added`, `task.updated`)
- Confirm whether Project Tracker tasks support:
  - subtasks
  - tags/labels
  - milestone grouping
  - project concept (`projectId`) vs `projectName` fallback

**Notes**
- If the OpenAPI already includes response examples, attach the spec and highlight the example sections.
- If not, add examples to the OpenAPI or provide a short separate snippet for each response.

---

## 16) Concrete Examples (Copy/Paste)

These examples reflect the **current Project Tracker behavior** from the implemented routes.

**POST `/api/ideaforge/tasks/sync` response**
```
{
  "ideaId": "idea_123",
  "planVersion": "v3",
  "mappedTasks": [
    { "planTaskId": "task_1", "taskId": "2b0c8b64-1d67-4d1f-9dc2-7d41d04bd9d1", "created": true }
  ],
  "syncedAt": "2026-01-31T12:34:56.789Z"
}
```

**GET `/api/ideaforge/tasks/changes?since=...` response**
```
{
  "tasks": [
    {
      "taskId": "2b0c8b64-1d67-4d1f-9dc2-7d41d04bd9d1",
      "planTaskId": "task_1",
      "ideaId": "idea_123",
      "planVersion": "v3",
      "status": "completed",
      "dueDate": "2026-02-01",
      "updatedAt": "2026-01-31T12:10:11.222Z"
    }
  ],
  "notes": [
    {
      "commentId": "0f5d0c8a-3e7d-4f07-9017-2d7a08f9c4f1",
      "taskId": "2b0c8b64-1d67-4d1f-9dc2-7d41d04bd9d1",
      "planTaskId": "task_1",
      "ideaId": "idea_123",
      "planVersion": "v3",
      "content": "Done, shipped",
      "source": "app",
      "createdAt": "2026-01-31T12:12:13.456Z"
    }
  ],
  "serverTime": "2026-01-31T12:20:00.000Z"
}
```

---

## 17) Webhook Event Examples

**task.status_changed**
```
{
  "type": "task.status_changed",
  "ideaId": "idea_123",
  "planVersion": "v3",
  "planTaskId": "task_1",
  "taskId": "2b0c8b64-1d67-4d1f-9dc2-7d41d04bd9d1",
  "occurredAt": "2026-01-31T12:10:11.222Z",
  "data": {
    "previousStatus": "in_progress",
    "status": "completed"
  }
}
```

**task.due_date_changed**
```
{
  "type": "task.due_date_changed",
  "ideaId": "idea_123",
  "planVersion": "v3",
  "planTaskId": "task_1",
  "taskId": "2b0c8b64-1d67-4d1f-9dc2-7d41d04bd9d1",
  "occurredAt": "2026-01-31T12:10:11.222Z",
  "data": {
    "previousDueDate": "2026-01-30",
    "dueDate": "2026-02-01"
  }
}
```

**task.note_added**
```
{
  "type": "task.note_added",
  "ideaId": "idea_123",
  "planVersion": "v3",
  "planTaskId": "task_1",
  "taskId": "2b0c8b64-1d67-4d1f-9dc2-7d41d04bd9d1",
  "occurredAt": "2026-01-31T12:12:13.456Z",
  "data": {
    "commentId": "0f5d0c8a-3e7d-4f07-9017-2d7a08f9c4f1",
    "content": "Done, shipped",
    "source": "app"
  }
}
```

**task.updated**
```
{
  "type": "task.updated",
  "ideaId": "idea_123",
  "planVersion": "v3",
  "planTaskId": "task_1",
  "taskId": "2b0c8b64-1d67-4d1f-9dc2-7d41d04bd9d1",
  "occurredAt": "2026-01-31T12:10:11.222Z",
  "data": {
    "changedFields": ["title", "description"]
  }
}
```

**Note on task.updated payload**
- Current implementation sends **only `changedFields`**, not a full task snapshot.

---

## 18) Feature Support Confirmations (Current Project Tracker)

**subtasks**: Yes  
**tags/labels**: No  
**milestone grouping**: No  
**project entity**: Yes (`projectId` required). For `/tasks/sync`, `projectId` may be omitted and `projectName` may be used as a fallback.

---

## 19) /tasks/sync Response + Changes Cursor Semantics

**/tasks/sync response reality**
- Current response includes: `mappedTasks: [{ planTaskId, taskId, created }]`
- It does **not** include `projectId`.
- Recommended enhancement: include `projectId` in each mapping or add a separate `mappings` array:
  - `mappings: [{ planTaskId, taskId, projectId }]`

**/tasks/changes cursor semantics**
- Current implementation uses `updatedAt > since` (exclusive), and `createdAt > since` for notes.
- No explicit ordering guarantees are enforced in the response.
- Recommended: sort by `(updatedAt, id)` for tasks and `(createdAt, id)` for notes, and document cursor semantics explicitly as **exclusive**.

---

## 20) OpenAPI Spec (Full)

```
openapi: 3.0.3
info:
  title: IdeaForge Integration API
  version: 1.0.0
  description: Project Tracker endpoints for IdeaForge integration.
servers:
  - url: https://your-project-tracker.com
security:
  - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
  schemas:
    ErrorResponse:
      type: object
      properties:
        error:
          type: string
        details:
          type: object
      required: [error]
    Sprint:
      type: object
      properties:
        id: { type: string, format: uuid }
        userId: { type: string, format: uuid }
        name: { type: string }
        startDate: { type: string }
        endDate: { type: string }
        goalSummary: { type: string, nullable: true }
        isActive: { type: boolean }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    SprintWeek:
      type: object
      properties:
        id: { type: string, format: uuid }
        sprintId: { type: string, format: uuid }
        weekIndex: { type: integer }
        startDate: { type: string }
        endDate: { type: string }
        theme: { type: string, nullable: true }
        notes: { type: string, nullable: true }
    Opportunity:
      type: object
      properties:
        id: { type: string, format: uuid }
        userId: { type: string, format: uuid }
        sprintId: { type: string, format: uuid, nullable: true }
        name: { type: string }
        type: { type: string, enum: [MAJOR, MICRO] }
        lane: { type: string, nullable: true }
        summary: { type: string, nullable: true }
        complexity: { type: string, nullable: true }
        estimatedCost: { type: string, nullable: true }
        goToMarket: { type: string, nullable: true }
        details: { type: string, nullable: true }
        status:
          type: string
          enum: [IDEA, PLANNING, ACTIVE, ON_HOLD, COMPLETED, KILLED]
        priority: { type: integer, minimum: 1, maximum: 4 }
        notes: { type: string, nullable: true }
        actualCost: { type: string, nullable: true }
        revenue: { type: string, nullable: true }
        profit: { type: string, nullable: true }
        decision: { type: string, enum: [KEEP, ADJUST, CANCEL, UNDECIDED] }
        outcomeNotes: { type: string, nullable: true }
        completedAt: { type: string, format: date-time, nullable: true }
    TaskSyncRequest:
      type: object
      properties:
        ideaId: { type: string }
        planVersion: { type: string }
        tasks:
          type: array
          items:
            type: object
            properties:
              planTaskId: { type: string }
              title: { type: string }
              description: { type: string, nullable: true }
              priority: { type: integer, minimum: 1, maximum: 4 }
              budgetPlanned: { type: string, nullable: true }
              sprintId: { type: string, format: uuid, nullable: true }
              sprintWeekId: { type: string, format: uuid, nullable: true }
              opportunityId: { type: string, format: uuid, nullable: true }
              dueDate: { type: string, nullable: true }
              projectId: { type: string, format: uuid, nullable: true }
              projectName: { type: string, nullable: true }
            required: [planTaskId, title]
      required: [ideaId, planVersion, tasks]
    TaskSyncResponse:
      type: object
      properties:
        ideaId: { type: string }
        planVersion: { type: string }
        mappedTasks:
          type: array
          items:
            type: object
            properties:
              planTaskId: { type: string }
              taskId: { type: string, format: uuid }
              created: { type: boolean }
        syncedAt: { type: string, format: date-time }
paths:
  /api/ideaforge/pattern4/sprints:
    get:
      summary: List sprints
      responses:
        '200':
          description: OK
    post:
      summary: Create sprint
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                startDate: { type: string }
                endDate: { type: string }
                goalSummary: { type: string }
              required: [name, startDate, endDate]
      responses:
        '201':
          description: Created
  /api/ideaforge/pattern4/sprints/{id}:
    get:
      summary: Get sprint
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
    patch:
      summary: Update sprint
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200': { description: OK }
    delete:
      summary: Delete sprint
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/sprints/{id}/complete:
    post:
      summary: Complete sprint
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/weeks:
    get:
      summary: List weeks for sprint
      parameters:
        - in: query
          name: sprintId
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
    post:
      summary: Create week
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '201': { description: Created }
  /api/ideaforge/pattern4/weeks/generate:
    post:
      summary: Generate 13 weeks
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sprintId: { type: string, format: uuid }
              required: [sprintId]
      responses:
        '201': { description: Created }
  /api/ideaforge/pattern4/weeks/{id}:
    patch:
      summary: Update week
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200': { description: OK }
    delete:
      summary: Delete week
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/opportunities:
    get:
      summary: List opportunities
      parameters:
        - in: query
          name: status
          required: false
          schema: { type: string }
        - in: query
          name: sprintId
          required: false
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
    post:
      summary: Create opportunity
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '201': { description: Created }
  /api/ideaforge/pattern4/opportunities/{id}:
    get:
      summary: Get opportunity
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
    patch:
      summary: Update opportunity
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200': { description: OK }
    delete:
      summary: Delete opportunity
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/opportunities/{id}/complete:
    post:
      summary: Complete opportunity
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/opportunities/{id}/kill:
    post:
      summary: Kill opportunity
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/stats/sprint/{id}:
    get:
      summary: Sprint stats
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/stats/week/{id}:
    get:
      summary: Week stats
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/pattern4/stats/opportunity/{id}:
    get:
      summary: Opportunity stats
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /api/ideaforge/tasks/sync:
    post:
      summary: Upsert plan tasks
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskSyncRequest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskSyncResponse'
  /api/ideaforge/tasks/changes:
    get:
      summary: Changes feed
      parameters:
        - in: query
          name: since
          required: false
          schema: { type: string }
      responses:
        '200': { description: OK }
  /api/ideaforge/tasks/{id}/notes:
    post:
      summary: Append-only note
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                content: { type: string }
                contentHtml: { type: string }
      responses:
        '201': { description: Created }
```
 
