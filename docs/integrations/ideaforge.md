# IdeaForge Integration

This document describes the server-to-server integration between IdeaForge and Project Tracker.

## Overview

- **Auth:** API key (server-to-server)
- **Source of truth:**
  - IdeaForge: idea content, plan structure, task definitions
  - Project Tracker: execution status, due date changes, task notes
- **Sync:** IdeaForge pushes plans/tasks; Project Tracker sends webhooks and provides a changes feed.

## Authentication

All requests must include:

```
Authorization: Bearer <integration_key>
```

### Storing API keys

API keys are stored **hashed** in `integration_api_keys`. Example:

1) Generate a key and hash it (SHA-256)
2) Insert into `integration_api_keys` with `integration='ideaforge'` and the target `user_id`

## Rate limits

Per-IP and per-key buckets:

- Burst: 20 requests per 10 seconds
- Sustained: 100 requests per 10 minutes

## Endpoints

### Pattern4

**Sprints**
- `GET /api/ideaforge/pattern4/sprints`
- `POST /api/ideaforge/pattern4/sprints`
- `GET /api/ideaforge/pattern4/sprints/:id`
- `PATCH /api/ideaforge/pattern4/sprints/:id`
- `DELETE /api/ideaforge/pattern4/sprints/:id`
- `POST /api/ideaforge/pattern4/sprints/:id/complete`

**Weeks**
- `GET /api/ideaforge/pattern4/weeks?sprintId=`
- `POST /api/ideaforge/pattern4/weeks`
- `PATCH /api/ideaforge/pattern4/weeks/:id`
- `DELETE /api/ideaforge/pattern4/weeks/:id`
- `POST /api/ideaforge/pattern4/weeks/generate`

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

### Task sync

- `POST /api/ideaforge/tasks/sync`
- `GET /api/ideaforge/tasks/changes?since=`
- `POST /api/ideaforge/tasks/:id/notes`
  - `:id` can be either a Project Tracker `taskId` or IdeaForge `planTaskId`

### Webhook (Project Tracker → IdeaForge)

Project Tracker POSTs to `IDEAFORGE_WEBHOOK_URL` when a mapped task changes.

**Headers**
```
X-IdeaForge-Signature: <sha256 hmac of raw body>
```

**Payload**
```
{
  "type": "task.status_changed" | "task.due_date_changed" | "task.note_added" | "task.updated",
  "ideaId": "string",
  "planVersion": "string",
  "planTaskId": "string",
  "taskId": "uuid",
  "occurredAt": "ISO-8601",
  "data": { ... }
}
```

## Task mapping

IdeaForge → Project Tracker mapping is stored in `ideaforge_sync_map`:

- `idea_id`, `plan_version`, `plan_task_id`
- `task_id`, `project_id`
- `sprint_id`, `sprint_week_id`, `opportunity_id`
- `last_sync_at`, `last_change_source`

## Notes

- Task notes are append-only and stored as `task_comments` with `source='ideaforge'`.
- Notes created in Project Tracker use `source='app'`.

## Required environment variables

- `IDEAFORGE_WEBHOOK_URL`
- `IDEAFORGE_WEBHOOK_SECRET`
