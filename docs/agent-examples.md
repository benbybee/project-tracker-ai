# AI Agent - Usage Examples

## Overview

The AI Agent is an intelligent assistant that can execute actions in your project tracker. It understands natural language commands and can perform tasks like creating projects, managing tasks, searching, and generating reports.

## How to Use

1. Navigate to the AI Chat page
2. Toggle to "Agent" mode
3. Type your command in natural language
4. The agent will either:
   - Execute simple actions immediately
   - Request approval for complex/destructive actions
   - Provide information from your data

## Command Examples

### Project Management

**Create Projects:**

```
Create a new project called "Website Redesign"
Create a website project for client ABC with domain abc.com
Make a new general project named "Internal Tools"
```

**Search Projects:**

```
Show me all my website projects
Find projects related to "redesign"
List all my projects
```

**Get Project Stats:**

```
Get statistics for "Website Redesign" project
Show me the status of project XYZ
How many tasks are in the Marketing project?
```

### Task Management

**Create Tasks:**

```
Add a task to implement login page
Create a high priority task in Website Redesign: Fix navigation bug
Add a task "Update documentation" due next Friday
```

**Update Tasks:**

```
Mark task ABC123 as completed
Change the status of "Fix bug" to in progress
Update task title to "Implement user authentication"
```

**Search Tasks:**

```
Show me all overdue tasks
Find tasks related to authentication
List all blocked tasks
What tasks are due today?
```

**Change Status:**

```
Mark task XYZ as completed
Set "Implement login" to in progress
Block task ABC because of missing requirements
```

### Notes

**Create Notes:**

```
Create a note in project ABC: "Client wants dark mode feature"
Add a note about the meeting with client
Write a note in Website Redesign about design feedback
```

### Analytics & Reports

**Task Summaries:**

```
Show me all my high priority tasks
Get a summary of overdue tasks
How many tasks are not started?
```

**Project Statistics:**

```
Get stats for Website Redesign project
Show me completion rate for project ABC
How many tasks are completed in Marketing project?
```

**Generate Reports:**

```
Generate a weekly report
Create a monthly summary
Give me a daily report
```

## Understanding Agent Responses

### Immediate Execution (Simple Actions)

When you create, update, or search for items, the agent executes immediately and shows results:

- ✅ **Completed**: Action succeeded
- ❌ **Failed**: Action failed with error message
- 🔄 **Retried**: Action was retried after failure

### Approval Required (Complex Actions)

Destructive actions require your approval:

- Delete project
- Delete task
- Bulk operations

The agent will show:

- **Action details**: What will be done
- **Impact warning**: What will be affected
- **Approval buttons**: Approve or Cancel

### Response Mode

For informational queries, the agent provides conversational responses with data from your system.

## Tips for Better Results

1. **Be Specific**: Include project names, task IDs, or search terms
2. **Use Context**: The agent knows your recent projects and tasks
3. **Natural Language**: Write as you would to a colleague
4. **Multi-step Commands**: You can combine actions like "Create project X and add 3 tasks"

## Common Patterns

### Project + Task Creation

```
Create a project "Mobile App" and add tasks:
- Design mockups
- Implement authentication
- Set up backend
```

### Status Updates

```
Mark all my overdue tasks as in progress
Complete task ABC123 and add a note
```

### Search + Action

```
Find all blocked tasks and show me why they're blocked
List overdue tasks and mark them as high priority
```

## Troubleshooting

**"Project not found"**

- Check project name spelling
- Use exact project name or provide project ID
- List projects first: "Show me all my projects"

**"Rate limit exceeded"**

- You can send 10 commands per minute
- Maximum 50 commands per hour
- Wait a moment and try again

**"Approval required"**

- Review the action details carefully
- Check the impact warning
- Select actions to approve or cancel all

## Advanced Usage

### Using Project Context

The agent remembers your recent projects:

```
Add a task to my latest project
Create a task in the project I just created
```

### Filtering and Searching

```
Show tasks due within 3 days
Find high priority tasks in project ABC
List all completed tasks this week
```

### Batch Operations

```
Mark all these tasks as completed: [task1, task2, task3]
Create 5 tasks for the website redesign checklist
```

## Security Notes

- All actions execute with your user permissions
- Destructive actions always require approval
- The agent cannot access other users' data
- Rate limits prevent abuse

## Feedback

If the agent doesn't understand your command:

- Try rephrasing more specifically
- Break complex commands into steps
- Use the quick action buttons for examples
- Check this documentation for supported patterns
