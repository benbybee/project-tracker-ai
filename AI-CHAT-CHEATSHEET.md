# AI Chat Agent Cheatsheet

Quick reference guide for using the AI chat agent in your project tracker.

## Quick Start

The AI chat agent understands natural language commands and structured syntax using `@` (for projects) and `/` (for commands).

**Basic Format:**
- `@ProjectName` - References a project
- `/command "value"` - Executes a command with a value
- Combine them: `/task "Task name" @ProjectName`

---

## Navigation Commands

Navigate through the app using natural language:

| Command | Action |
|---------|--------|
| `open @BFCM` | Navigate to the BFCM project page |
| `show me @Summit` | Navigate to the Summit project page |
| `go to notes` | Navigate to the notes page |
| `open projects page` | Navigate to projects list |
| `show dashboard` | Navigate to dashboard |
| `go to board` | Navigate to board view |
| `open analytics` | Navigate to analytics page |

**Examples:**
```
open @BFCM
show me the notes page
go to dashboard
```

---

## Creating Items

### Create a Project

**Format:** `create @ProjectName` or `create project @ProjectName`

**Required:** Project name and type (general or website)

**Examples:**
```
create @MyNewProject
create website project @ClientSite
create general project @InternalTool
```

**Note:** The AI will ask for the project type if not specified.

### Create a Task

**Format:** `/task "Task title" @ProjectName`

**Optional parameters:**
- Description: Add after the title
- Due date: `due: YYYY-MM-DD`
- Priority: `priority: 1-4` (1=low, 4=urgent)
- Status: `status: not_started|in_progress|blocked|completed`

**Examples:**
```
/task "Fix login bug" @Summit
/task "Update homepage" @BFCM due: 2024-12-31
/task "Review code" @Summit priority: 3 status: in_progress
create /task "Write documentation" @MyProject
```

### Create a Note

**Format:** `/notes "Note content" @ProjectName`

**Examples:**
```
/notes "Meeting notes: discussed new features" @Summit
/notes "Client requested color changes" @BFCM
add /notes "Important reminder about deadline" @ProjectName
```

### Create a Role/Category

**Format:** `create role "RoleName" color: #HEXCODE`

**Examples:**
```
create role "Frontend" color: #3B82F6
create role "Backend" color: #10B981
```

---

## Updating Items

### Update a Project

**Format:** `update @ProjectName [changes]`

**Examples:**
```
update @Summit description: "Updated project description"
update @BFCM pinned: true
update @MyProject name: "NewProjectName"
```

### Update a Task

**Format:** `update /task "TaskTitle" [changes] @ProjectName`

**Examples:**
```
update /task "Fix bug" status: completed @Summit
update /task "Write docs" priority: 2 due: 2024-12-25 @MyProject
update /task "Review code" description: "Updated description" @Summit
```

### Update a Note

**Format:** `update /notes "NoteTitle" [changes] @ProjectName`

**Examples:**
```
update /notes "Meeting notes" content: "Updated content" @Summit
update /notes "Client feedback" title: "New title" @BFCM
```

### Update a Role

**Format:** `update role "RoleName" [changes]`

**Examples:**
```
update role "Frontend" name: "Frontend Dev"
update role "Backend" color: #EF4444
```

---

## Deleting Items

**Note:** Deletions require confirmation for safety.

### Delete a Project

**Format:** `delete @ProjectName`

**Examples:**
```
delete @OldProject
remove @TestProject
```

### Delete a Task

**Format:** `delete /task "TaskTitle" @ProjectName`

**Examples:**
```
delete /task "Old task" @Summit
remove /task "Completed task" @BFCM
```

### Delete a Note

**Format:** `delete /notes "NoteTitle" @ProjectName`

**Examples:**
```
delete /notes "Old note" @Summit
remove /notes "Outdated note" @BFCM
```

### Delete a Role

**Format:** `delete role "RoleName"`

**Examples:**
```
delete role "OldCategory"
remove role "Unused"
```

---

## Listing/Viewing Items

### List Projects

**Format:** `list projects` or `show projects`

**Filter by type:**
```
list projects type: website
show general projects
```

### List Tasks

**Format:** `list tasks` or `show tasks`

**Filter by project:**
```
list tasks @Summit
show tasks for @BFCM
```

**Filter by status:**
```
list tasks status: completed
show in_progress tasks @Summit
```

### List Notes

**Format:** `list notes` or `show notes`

**Filter by project:**
```
list notes @Summit
show notes for @BFCM
```

### List Roles

**Format:** `list roles` or `show roles`

**Examples:**
```
list roles
show all categories
```

---

## Natural Language Commands

The AI understands natural language, so you can phrase commands in various ways:

**Creating:**
```
Add a task called "Fix bug" to Summit
Create a note "Meeting notes" in BFCM project
Make a new project called "NewProject"
```

**Updating:**
```
Mark "Fix bug" task as completed in Summit
Change BFCM project description to "Updated"
Update "Meeting notes" in Summit project
```

**Viewing:**
```
What tasks are in Summit?
Show me all projects
List notes for BFCM
```

**Navigation:**
```
Take me to the Summit project
Open BFCM
Show the notes page
Go to dashboard
```

---

## Tips & Best Practices

### 1. Project Names
- Use `@ProjectName` to reference projects
- Project names are case-insensitive and fuzzy-matched
- If multiple projects match, the AI will ask you to be more specific

### 2. Task Commands
- Use `/task "Title"` for task commands
- Always include `@ProjectName` when creating tasks
- You can combine multiple parameters: `/task "Title" @Project priority: 3 due: 2024-12-31`

### 3. Note Commands
- Use `/notes "Content"` for note commands
- Notes are always associated with a project
- Title is auto-generated from content if not provided

### 4. Immediate Execution
- **Creates and updates execute immediately** - no confirmation needed
- **Only deletions require confirmation** - for safety

### 5. Getting Help
- Ask questions like "What can you do?" or "How do I create a task?"
- The AI can explain its capabilities and provide examples

---

## Common Patterns

### Quick Task Creation
```
/task "Task name" @Project
```

### Quick Note Taking
```
/notes "Note content" @Project
```

### Quick Navigation
```
open @ProjectName
```

### Bulk Operations
```
Create 3 tasks for @Project:
- Task 1
- Task 2  
- Task 3
```

### Status Updates
```
Mark all completed tasks in @Project as archived
Update @Project status
```

---

## Error Handling

If something goes wrong:
- **Project not found:** The AI will tell you and suggest similar names
- **Multiple matches:** The AI will list matches and ask you to be more specific
- **Missing required info:** The AI will ask for the specific missing information
- **Invalid command:** The AI will explain what went wrong

---

## Examples

### Complete Workflow Example

```
User: create @NewWebsite type: website
AI: What type of project? (general or website)
User: website
AI: Project "NewWebsite" created! [View project](/projects/123)

User: /task "Set up hosting" @NewWebsite priority: 3
AI: Task "Set up hosting" created in project "NewWebsite"! [View task](/projects/123)

User: /notes "Hosting provider: AWS" @NewWebsite
AI: Note created successfully in project "NewWebsite"! [View note](/projects/123)

User: open @NewWebsite
AI: Opening project "NewWebsite"... [Navigates to project page]
```

---

## Keyboard Shortcuts

While typing in the chat:
- **Enter** - Send message
- **Shift + Enter** - New line
- **Escape** - Close chat (if applicable)

---

## Advanced Usage

### Combining Commands
You can sometimes combine multiple operations:
```
Create task "Fix bug" @Summit and mark it as in_progress
```

### Contextual Commands
When viewing a project page, you can use shorter commands:
```
/task "New task"  (project context is already known)
```

### Natural Language Variations
The AI understands many phrasings:
- "add" = "create"
- "remove" = "delete"
- "show" = "list"
- "open" = "navigate to"
- "go to" = "navigate to"

---

## Support

If you encounter issues:
1. Check that project names are spelled correctly
2. Ensure required parameters are provided
3. Try rephrasing your command
4. Ask the AI for help: "How do I [action]?"

---

**Last Updated:** Based on current implementation with navigation, CRUD operations, and link generation.

