# Pattern 4 Enhancements - Testing Guide

This guide outlines the steps to verify the AI Integration, Task Management, and Analytics enhancements for the Pattern 4 Sprint System.

## Prerequisite
Ensure database migrations have been pushed:
```bash
pnpm db:push
```

## 1. Task Integration Testing

**Goal**: Verify full task CRUD operations within Pattern 4 pages.

1.  **Create Tasks**:
    *   Go to **Sprint Overview**. Click "Create Sprint" if none exists.
    *   Scroll to "Current Week Tasks". Click "+ Add Task".
    *   Create a task "Test Task 1" with Priority 1.
    *   Verify task appears in the list.
    *   Verify task appears in the main `tasks` table with `sprintId` and `sprintWeekId`.

2.  **Bulk Actions**:
    *   Create 2 more tasks ("Test Task 2", "Test Task 3").
    *   Select both tasks using the checkboxes.
    *   Click "Complete" in the floating bulk action bar.
    *   Verify both tasks are marked completed and crossed out.

3.  **Context Awareness**:
    *   Go to **Weeks** -> **Week 1**. Create a task.
    *   Verify it is automatically assigned to Week 1.
    *   Go to **Opportunities** -> **Create Opportunity**.
    *   Go to the new Opportunity detail page. Create a task.
    *   Verify it is assigned to that Opportunity.

## 2. Analytics & Charts Testing

**Goal**: Verify charts render correctly and reflect data updates.

1.  **Sprint Overview**:
    *   Check the "Burndown", "Recent Velocity", and "Opportunity Status" mini-charts.
    *   They should not be empty (unless no data exists).

2.  **Analytics Page**:
    *   Navigate to **Pattern 4** -> **Analytics**.
    *   **Overview Tab**: Check Burndown and Completion Trends.
    *   **Financial Tab**: Check "Opportunity Profitability" bar chart.
    *   **Opportunities Tab**: Check distribution pie charts.
    *   **Velocity Tab**: Check weekly velocity bar chart.

3.  **Real-time Updates**:
    *   Complete a task in **Sprint Overview**.
    *   Refresh **Analytics** page.
    *   Verify "Velocity" and "Completion Trends" update.

## 3. AI Integration Testing

**Goal**: Verify AI planner capabilities.

1.  **Sprint Planning**:
    *   Click "AI: Plan My Sprint" on **Sprint Overview**.
    *   Prompt: "Create a 90-day sprint called 'Q3 Launch' with a goal to launch the MVP."
    *   Review the **AI Proposal Dialog**.
    *   Confirm changes.
    *   Verify Sprint and Weeks are created.

2.  **Week Rebalancing**:
    *   Go to **Week Detail**.
    *   Click "AI: Rebalance Week".
    *   Prompt: "Move low priority tasks to next week."
    *   Review proposal and confirm.

3.  **Opportunity Analysis**:
    *   Go to **Opportunity Detail**.
    *   Click "AI: Analyze".
    *   Prompt: "Is this opportunity worth the cost?"
    *   Check AI response and recommendations.

## Troubleshooting

*   **Charts Empty?** Ensure tasks have `createdAt` and `updatedAt` dates. Run a script to backfill if testing with old data.
*   **AI Error?** Check `OPENAI_API_KEY` in `.env`.
*   **Database Error?** Ensure `pnpm db:push` ran successfully to add indexes.

