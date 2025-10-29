import { ProductivityPattern } from './pattern-analyzer';

export interface DailyPlanContext {
  currentTime: Date;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    dueDate?: string;
    estimatedMinutes?: number;
    role?: string;
  }>;
  userPatterns?: ProductivityPattern;
  workingHoursStart?: number; // Hour of day (0-23)
  workingHoursEnd?: number; // Hour of day (0-23)
}

export function buildDailyPlanPrompt(context: DailyPlanContext): string {
  const {
    currentTime,
    tasks,
    userPatterns,
    workingHoursStart = 9,
    workingHoursEnd = 17,
  } = context;

  const currentHour = currentTime.getHours();
  const availableHours = Math.max(0, workingHoursEnd - currentHour);

  // Format tasks for the prompt
  const tasksSummary = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
    estimatedMinutes:
      t.estimatedMinutes || userPatterns?.completionTimes?.[t.priority] || 60,
    role: t.role,
  }));

  const productiveHours = userPatterns?.productiveHours || [];
  const avgDurations = userPatterns?.completionTimes || {};
  const velocity = userPatterns?.velocity;
  const confidence = userPatterns?.confidenceScore || 0.5;

  return `You are an expert productivity AI assistant. Create an optimized daily task plan for the user.

CURRENT CONTEXT:
- Current time: ${currentTime.toLocaleString()}
- Available hours today: ${availableHours}
- Working hours: ${workingHoursStart}:00 to ${workingHoursEnd}:00

USER PRODUCTIVITY PATTERNS (Confidence: ${(confidence * 100).toFixed(0)}%):
${productiveHours.length > 0 ? `- Most productive hours: ${productiveHours.join(', ')}` : '- No productivity pattern data yet'}
${velocity ? `- Average velocity: ${velocity.tasksPerDay.toFixed(1)} tasks/day (${velocity.trend})` : ''}
${
  Object.keys(avgDurations).length > 0
    ? `- Average durations by priority:
${Object.entries(avgDurations)
  .map(([p, d]) => `  Priority ${p}: ${d} minutes`)
  .join('\n')}`
    : ''
}

TASKS TO SCHEDULE (${tasks.length} tasks):
${JSON.stringify(tasksSummary, null, 2)}

INSTRUCTIONS:
1. Prioritize tasks based on:
   - Due dates (overdue and due today first)
   - Priority level (1=highest, 4=lowest)
   - Task dependencies and logical order
   - User's productive hours

2. Create a realistic schedule considering:
   - Available time today (${availableHours} hours)
   - Estimated durations from user's history
   - Need for breaks (suggest 10-min break after every 2 hours)
   - Energy levels throughout the day

3. Flag risks:
   - Overcommitment (too many tasks for available time)
   - Unrealistic time estimates
   - Conflicting priorities

4. Provide actionable recommendations:
   - Specific order to tackle tasks
   - Suggested time blocks for each task
   - Which tasks to defer to tomorrow if needed
   - Quick wins to build momentum

RESPONSE FORMAT (JSON):
{
  "plan": [
    {
      "taskId": "task-id",
      "order": 1,
      "suggestedStartTime": "10:00",
      "estimatedDuration": 45,
      "reasoning": "High priority and due today"
    }
  ],
  "breaks": [
    {
      "afterTask": "task-id",
      "duration": 10,
      "type": "short_break"
    }
  ],
  "deferredTasks": ["task-id-2", "task-id-3"],
  "totalEstimatedMinutes": 240,
  "risks": [
    {
      "type": "overcommitment",
      "severity": "medium",
      "message": "You have 5 hours of work but only 4 hours available"
    }
  ],
  "summary": "Focus on completing the 3 high-priority tasks this morning while you're most productive. Defer the lower-priority items to tomorrow.",
  "confidence": 0.85
}

Generate the optimal daily plan now:`;
}

export function buildTaskEstimatePrompt(
  taskTitle: string,
  taskDescription?: string,
  similarTasks?: Array<{ title: string; duration: number }>
): string {
  return `You are a task estimation expert. Estimate how long this task will take to complete.

TASK:
Title: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

${
  similarTasks && similarTasks.length > 0
    ? `SIMILAR TASKS (for reference):
${similarTasks.map((t) => `- "${t.title}": ${t.duration} minutes`).join('\n')}`
    : ''
}

INSTRUCTIONS:
1. Consider the complexity and scope from the title and description
2. Use similar tasks as reference if provided
3. Be realistic - account for context switching and unexpected issues
4. Round to nearest 15 minutes

RESPONSE FORMAT (JSON):
{
  "estimatedMinutes": 60,
  "confidence": 0.8,
  "reasoning": "Based on similar tasks, this appears to be a standard implementation task that typically takes 45-60 minutes."
}

Provide your estimate:`;
}

export function buildPrioritySuggestionPrompt(context: {
  task: { title: string; description?: string; dueDate?: string };
  otherTasks: Array<{ title: string; priority: string; dueDate?: string }>;
  currentDate: Date;
}): string {
  const { task, otherTasks, currentDate } = context;

  return `You are a priority management expert. Suggest the appropriate priority for this task.

NEW TASK:
Title: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
${task.dueDate ? `Due Date: ${task.dueDate}` : 'No due date'}

CONTEXT (other tasks):
${otherTasks
  .slice(0, 5)
  .map(
    (t) =>
      `- [P${t.priority}] ${t.title} ${t.dueDate ? `(due: ${t.dueDate})` : ''}`
  )
  .join('\n')}

PRIORITY SCALE:
- Priority 1 (P1): Urgent and critical - needs immediate attention
- Priority 2 (P2): Important but not urgent - high value work
- Priority 3 (P3): Normal priority - routine work
- Priority 4 (P4): Low priority - nice to have

CURRENT DATE: ${currentDate.toISOString().split('T')[0]}

RESPONSE FORMAT (JSON):
{
  "suggestedPriority": "2",
  "reasoning": "This task is important for the project but not time-sensitive. P2 allows scheduling within the next few days.",
  "confidence": 0.9
}

Suggest the priority:`;
}

export function buildContextualSuggestionPrompt(context: {
  currentView: 'dashboard' | 'project' | 'daily';
  userActivity: string;
  relevantTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  patterns?: ProductivityPattern;
}): string {
  const { currentView, userActivity, relevantTasks, patterns } = context;

  return `You are a proactive productivity assistant. Based on the user's current context, suggest helpful actions.

CURRENT CONTEXT:
- View: ${currentView}
- Recent activity: ${userActivity}
- Time: ${new Date().toLocaleString()}

RELEVANT TASKS:
${relevantTasks
  .slice(0, 5)
  .map((t) => `- [${t.status}] ${t.title} (P${t.priority})`)
  .join('\n')}

${
  patterns
    ? `USER PATTERNS:
- Velocity: ${patterns.velocity?.tasksPerDay.toFixed(1)} tasks/day
- Trend: ${patterns.velocity?.trend}
- Productive hours: ${patterns.productiveHours?.join(', ')}`
    : ''
}

INSTRUCTIONS:
Generate 1-3 contextual suggestions that would help the user be more productive right now. Consider:
- Overdue tasks that need attention
- Tasks that could be started now based on time of day
- Opportunities to batch similar work
- Warning signs of overcommitment

RESPONSE FORMAT (JSON):
{
  "suggestions": [
    {
      "type": "focus_block",
      "title": "Start high-priority work now",
      "message": "You have 2 hours until your next meeting. Perfect time to tackle the database migration task.",
      "action": {
        "type": "start_task",
        "taskId": "task-123"
      },
      "priority": "high"
    }
  ]
}

Generate suggestions:`;
}
