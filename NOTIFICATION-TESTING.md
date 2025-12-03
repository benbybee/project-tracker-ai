# Notification System Testing Guide

## Overview

The notification system now supports four types of personal productivity notifications:

1. **task_reminder** - Tasks due today
2. **due_date_approaching** - Tasks due in 1-2 days
3. **ai_suggestion** - High-priority AI suggestions
4. **sync_conflict** - Tasks blocked or projects in client review for >2 days

## Setup

### Environment Variables

Ensure you have `CRON_SECRET` set in your `.env` file:

```bash
CRON_SECRET=your-secret-here
```

### Cron Schedule

The notification check runs daily at 8:00 AM UTC via Vercel Cron:

```json
{
  "path": "/api/notifications/check-due-dates",
  "schedule": "0 8 * * *"
}
```

## Manual Testing

### 1. Test the Cron Endpoint Locally

```bash
# Using curl (replace YOUR_CRON_SECRET with your actual secret)
curl -X POST http://localhost:3000/api/notifications/check-due-dates \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "message": "Notification check job completed",
  "results": {
    "total": 1,
    "dueTodayCount": 0,
    "dueSoonCount": 0,
    "staleBlockedCount": 0,
    "staleClientReviewCount": 0,
    "errors": []
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Create Test Data

#### Tasks Due Today

```sql
-- In your database, create a task with today's date
INSERT INTO tasks (user_id, project_id, title, due_date, status, archived)
VALUES (
  'your-user-id',
  'your-project-id',
  'Test task due today',
  CURRENT_DATE,
  'not_started',
  false
);
```

#### Tasks Due Soon

```sql
-- Create a task due tomorrow
INSERT INTO tasks (user_id, project_id, title, due_date, status, archived)
VALUES (
  'your-user-id',
  'your-project-id',
  'Test task due tomorrow',
  CURRENT_DATE + INTERVAL '1 day',
  'not_started',
  false
);
```

#### Blocked Tasks (>2 days)

```sql
-- Create a blocked task from 3 days ago
INSERT INTO tasks (user_id, project_id, title, status, blocked_at, blocked_reason, archived)
VALUES (
  'your-user-id',
  'your-project-id',
  'Test blocked task',
  'blocked',
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  'Waiting on external dependency',
  false
);
```

#### Projects in Client Review (>2 days)

```sql
-- Create a project in client review for 3+ days
INSERT INTO projects (user_id, name, type, website_status, updated_at)
VALUES (
  'your-user-id',
  'Test project in review',
  'website',
  'client_review',
  CURRENT_TIMESTAMP - INTERVAL '3 days'
);
```

### 3. Verify Notifications

After running the cron endpoint, check the notifications:

```sql
-- View recent notifications
SELECT
  type,
  title,
  message,
  read,
  created_at
FROM notifications
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Test AI Suggestions

AI suggestions are created when:

- Priority is 'high', OR
- Confidence is > 0.7

To test:

```bash
# Trigger AI suggestions from the dashboard
curl -X POST http://localhost:3000/api/ai/suggest \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "currentView": "dashboard",
    "userActivity": "viewing tasks"
  }'
```

Check if high-priority suggestions created notifications in the UI.

### 5. Check Notification Bell

1. Log into the app
2. Look at the notification bell icon in the top navigation
3. You should see:
   - A badge with unread count if you have unread notifications
   - The bell icon changes from `Bell` to `BellRing` when you have unread items
4. Click the bell to open the dropdown and see your notifications

## Production Testing

After deploying to Vercel:

```bash
# Test the production endpoint
curl -X POST https://your-domain.vercel.app/api/notifications/check-due-dates \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Troubleshooting

### No notifications appearing?

1. **Check the cron job ran**: View Vercel logs for the function execution
2. **Verify test data exists**: Ensure you have tasks/projects matching the criteria
3. **Check notification settings**: Ensure notifications aren't being filtered
4. **Database check**: Query the notifications table directly to see if they were created

### Duplicate notifications?

The system checks for existing notifications created today before sending new ones. If you're seeing duplicates:

1. Check the `createdAt` timestamp logic in the cron job
2. Ensure the queries are filtering correctly

### Cron not running?

1. **Verify CRON_SECRET**: Must be set in Vercel environment variables
2. **Check Vercel Cron logs**: Go to Deployments → Functions → Cron tab
3. **Test manually**: Use the curl commands above to verify the endpoint works

## Notification Types Reference

| Type                 | Icon | When Triggered                                           | Link                    |
| -------------------- | ---- | -------------------------------------------------------- | ----------------------- |
| task_reminder        | 📋   | Task due date = today                                    | `/projects/{projectId}` |
| due_date_approaching | ⏰   | Task due in 1-2 days                                     | `/projects/{projectId}` |
| sync_conflict        | ⚠️   | Task blocked >2 days OR project in client_review >2 days | `/projects/{id}`        |
| ai_suggestion        | 🤖   | High-priority AI suggestion generated                    | `/dashboard` or custom  |

## Next Steps

After verifying everything works:

1. Monitor the notification bell for the first few days
2. Adjust the cron schedule if needed (currently 8:00 AM UTC)
3. Fine-tune notification thresholds (e.g., change from 2 days to 3 days)
4. Consider adding notification preferences to the settings page
