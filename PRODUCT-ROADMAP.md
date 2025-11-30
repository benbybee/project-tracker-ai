# Product Tracker AI - Product Roadmap

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Status:** Active Planning Document

---

## Executive Summary

This roadmap outlines comprehensive UI/UX improvements and feature additions to transform Project Tracker AI into a premium, AI-powered personal productivity platform. Designed for individual power users who demand seamless mobile experiences, intelligent automation, and deep integrations.

### Key Focus Areas

- Premium UI/UX polish with dark mode and enhanced animations
- Mobile-first experience with bottom navigation and easy status changes
- Windows/Linux keyboard shortcuts (Mac alternatives included)
- Calendar view and scheduling system
- Recurring tasks and templates
- Simplified Slack integration for task creation
- Advanced analytics and AI insights

---

## Phase 1: Premium UI/UX Polish

### Sprint 1.1 - Dark Mode & Theme System

**Priority:** High | **Complexity:** Low | **Duration:** 2-3 days

#### Features

1. **Theme Toggle Component**
   - Add theme switcher in settings page and topbar
   - Persist preference in localStorage
   - Smooth transition animations between themes
   - System preference detection (`prefers-color-scheme`)
   - Toggle keyboard shortcut: `Ctrl+Shift+D` (Windows) / `Cmd+Shift+D` (Mac)

2. **Theme Refinement**
   - Audit all components for dark mode compatibility
   - Enhance glass morphism effects in dark mode
   - Improve contrast ratios for accessibility (WCAG AA compliant)
   - Theme-aware syntax highlighting for code blocks
   - Dark mode optimized for OLED displays

3. **Future Enhancement: Custom Theme Builder**
   - User-created custom color schemes
   - Predefined theme presets: Ocean, Forest, Sunset, Cyberpunk
   - Export/import theme configurations

#### Files to Update

- `src/components/layout/topbar.tsx` - Add theme toggle button
- `src/app/(app)/settings/page.tsx` - Add theme settings section
- `src/store/ui.ts` - Add theme state management
- `src/app/globals.css` - Verify dark mode CSS variables

#### Success Criteria

- [ ] Theme toggle works instantly with smooth transitions
- [ ] All components render correctly in dark mode
- [ ] Theme preference persists across sessions
- [ ] System theme detection works on first load

---

### Sprint 1.2 - Enhanced Animations & Micro-interactions

**Priority:** High | **Complexity:** Low-Medium | **Duration:** 2-3 days

#### Features

1. **Loading States**
   - Skeleton loaders with shimmer effects (enhance existing)
   - Progress bars for long operations (AI calls, file uploads)
   - Optimistic UI updates with smooth rollback animations
   - Page transitions using Next.js view transitions API

2. **Interactive Feedback**
   - Button press animations (scale, ripple effects)
   - Card hover states with elevation changes
   - Enhanced drag-and-drop visual feedback
   - Success/error toast animations with better positioning
   - **Confetti animation on task completion** 🎉
   - Celebration animations for milestone achievements
   - Pulsing badge for high-priority tasks

3. **Page Transitions**
   - Fade-in animations for page loads
   - Staggered list animations for task/project lists
   - Smooth modal open/close with backdrop blur
   - Slide transitions for sidebar navigation

4. **Contextual Animations**
   - Progress bar animations when percentages change
   - Priority indicator pulsing for urgent tasks
   - Notification bell wiggle animation on new notifications
   - Activity feed real-time insertion animations

#### Files to Create/Update

- Create `src/components/ui/confetti.tsx` - Confetti celebration component
- Enhance `src/components/tasks/task-card.tsx` - Better hover states
- Update `src/components/kanban/KanbanTask.tsx` - Improved drag feedback
- Update `src/components/ui/toast.tsx` - Enhanced toast animations

#### Success Criteria

- [ ] Confetti triggers on task completion
- [ ] All interactive elements have visual feedback
- [ ] Page transitions feel smooth and polished
- [ ] Animations perform well on low-end devices

---

### Sprint 1.3 - Advanced Keyboard Shortcuts

**Priority:** High | **Complexity:** Low-Medium | **Duration:** 2-3 days

#### Features

**Global Shortcuts** (Windows/Linux primary, Mac in parentheses)

- `Ctrl + N` (`Cmd + N`) - Quick create task
- `Ctrl + Shift + P` (`Cmd + Shift + P`) - Quick create project
- `Ctrl + K` (`Cmd + K`) - Open command palette (existing)
- `Ctrl + ,` (`Cmd + ,`) - Open settings
- `Ctrl + /` (`Cmd + /`) - Show keyboard shortcuts help modal
- `Ctrl + B` (`Cmd + B`) - Toggle sidebar
- `Ctrl + Shift + D` (`Cmd + Shift + D`) - Toggle dark mode
- `G then D` - Go to Dashboard (vim-style navigation)
- `G then B` - Go to Board
- `G then P` - Go to Projects
- `G then C` - Go to Calendar (when implemented)
- `G then T` - Go to Tickets

**Context-Specific Shortcuts** (when task/project is focused)

- `E` - Edit selected task/project
- `Del` or `Backspace` - Archive selected task
- `C` - Mark task as complete
- `←` / `→` - Navigate between Kanban columns
- `↑` / `↓` - Navigate between tasks in list
- `Enter` - Open selected task details modal
- `Esc` - Close modals/cancel edits
- `1` - Set priority to P1 (highest)
- `2` - Set priority to P2
- `3` - Set priority to P3
- `4` - Set priority to P4 (lowest)
- `S then T` - Schedule for Today
- `S then W` - Schedule for This Week
- `D` - Duplicate task

**Shortcuts Help Modal**

- Searchable keyboard shortcuts reference
- Visual key combinations display (dynamically shows Ctrl or Cmd based on OS)
- Categorized by context: Global, Tasks, Projects, Navigation
- Auto-detects OS and displays appropriate modifier keys
- Practice mode to learn shortcuts
- Print-friendly layout

#### OS Detection Implementation

```typescript
// Detect OS for keyboard shortcuts
const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';
const altModKey = isMac ? '⌥' : 'Alt';
```

#### Files to Create

- `src/hooks/useKeyboardShortcuts.ts` - Main keyboard shortcuts hook with OS detection
- `src/components/ui/keyboard-shortcuts-modal.tsx` - Help modal with dynamic key display
- `src/lib/keyboard-utils.ts` - Utility functions for key detection and formatting

#### Files to Update

- `src/app/providers.tsx` - Include global shortcut provider
- `src/components/layout/topbar.tsx` - Add keyboard shortcut hint in footer or help icon
- `src/components/layout/sidebar.tsx` - Show keyboard shortcuts in tooltips

#### Success Criteria

- [ ] All shortcuts work on both Windows and Mac
- [ ] Shortcuts modal shows correct keys for user's OS
- [ ] Vim-style navigation (G then X) works reliably
- [ ] Shortcuts don't conflict with browser defaults
- [ ] Visual indicator on screen showing "Press Ctrl+/ for shortcuts"

---

### Sprint 1.4 - Mobile Experience Overhaul ⭐ CRITICAL

**Priority:** HIGHEST | **Complexity:** Medium | **Duration:** 3-5 days

#### Feature 1: Mobile Status Picker (PRIMARY FEATURE)

**Problem:** Drag-and-drop on mobile Kanban is extremely difficult and frustrating.

**Solution:** One-tap status change via bottom sheet modal.

**Implementation:**

1. **Disable Drag-and-Drop on Mobile**
   - Detect touch devices via CSS media query `@media (pointer: coarse)`
   - Disable `@dnd-kit` drag handlers on touch devices
   - Hide drag handles on mobile devices

2. **Status Change Button**
   - Add "Change Status" button to each task card (visible only on mobile)
   - Button appears below task title or in card actions area
   - Icon: Small status indicator with chevron down

3. **Bottom Sheet Status Picker**
   - Tapping button opens smooth bottom sheet modal
   - Display all available statuses:
     - Not Started
     - In Progress
     - Blocked
     - Completed
     - Content
     - Design
     - Dev
     - QA
     - Launch
   - Each status option shows:
     - Status name
     - Status icon
     - Color-coded background (matches Kanban column colors)
     - Checkmark if currently selected
   - Smooth slide-up animation (300ms)
   - Backdrop blur with tap-to-dismiss
   - One-tap to change status
   - Optional success toast confirmation
   - Auto-close sheet after selection

#### Feature 2: Mobile Footer Navigation (ICONS ONLY) ⭐ NEW

**Problem:** Opening sidebar menu requires tapping hamburger at top, then navigating.

**Solution:** Fixed bottom footer with quick access icons.

**Implementation:**

```tsx
// Mobile Footer Navigation (visible only on screens < 1024px)
<footer className="lg:hidden fixed bottom-0 inset-x-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-white/20 pb-safe z-40">
  <nav className="flex justify-around items-center h-16 safe-area-inset-bottom">
    <IconButton
      icon={Menu}
      onClick={openSidebar}
      label="Menu"
      active={sidebarOpen}
    />
    <IconButton
      icon={FolderKanban}
      href="/projects"
      label="Projects"
      active={pathname === '/projects'}
    />
    <IconButton
      icon={CalendarDays}
      href="/daily"
      label="Daily"
      active={pathname === '/daily'}
    />
    <IconButton
      icon={MessagesSquare}
      href="/tickets"
      label="Tickets"
      active={pathname === '/tickets'}
    />
  </nav>
</footer>
```

**Footer Menu Items:**

1. **Hamburger Menu (☰)** - Opens full sidebar menu
2. **Projects (folder icon)** - Navigate to `/projects`
3. **Daily (calendar icon)** - Navigate to `/daily`
4. **Tickets (message icon)** - Navigate to `/tickets`

**Features:**

- Fixed position at bottom (always visible while scrolling)
- Glass morphism styling to match app aesthetic
- Active state highlighting (icon and text color change)
- Smooth icon transitions on tap
- iOS safe area padding for notch devices
- Hidden on desktop (≥1024px)

**Remove from Mobile:**

- Hamburger icon from topbar (move entirely to footer)
- Mobile sidebar trigger from top-left

#### Feature 3: Additional Mobile Improvements

**Touch Gestures:**

- Swipe left on task card to quickly mark complete
- Swipe right on task card to snooze (move to tomorrow)
- Long press on task for context menu
- Pull-to-refresh on task lists

**Mobile UI Optimizations:**

- Bottom sheet modals instead of center modals (native feel)
- Larger touch targets (minimum 44x44px per Apple/Google guidelines)
- Simplified navigation patterns
- Reduced cognitive load

**Platform-Specific:**

- **iOS:** Safari toolbar color matching via meta tags
- **Android:** Material Design haptic feedback
- **Both:** Native share sheet integration
- **PWA:** Add to home screen prompts with custom splash screens

#### Files to Create

- `src/components/mobile/task-status-picker.tsx` ⭐ NEW - Bottom sheet status selector
- `src/components/mobile/mobile-footer-nav.tsx` ⭐ NEW - Fixed footer navigation
- `src/hooks/useTouchDevice.ts` - Device detection hook

#### Files to Update

- `src/components/kanban/KanbanBoard.tsx` - Disable drag-and-drop on mobile
- `src/components/kanban/KanbanTask.tsx` - Add status change button for mobile
- `src/components/layout/topbar.tsx` - Hide hamburger menu on mobile
- `src/components/layout/app-layout.tsx` - Integrate mobile footer, add `pb-16` on mobile for footer spacing
- `src/components/layout/sidebar.tsx` - Remove mobile open trigger from top

#### Success Criteria

- [ ] Drag-and-drop disabled on mobile (verified on iOS and Android)
- [ ] Status picker opens smoothly with one tap
- [ ] All statuses visible and selectable in bottom sheet
- [ ] Status change updates immediately with animation
- [ ] Footer navigation visible and functional on mobile
- [ ] Hamburger removed from top on mobile
- [ ] Active page highlighted in footer
- [ ] Footer respects iOS safe area
- [ ] No layout shift when footer appears

---

### Sprint 1.5 - Inline Editing & Quick Actions

**Priority:** High | **Complexity:** Low-Medium | **Duration:** 2-3 days

#### Features

**1. Inline Editing**

- Double-click task title to edit in place (no modal needed)
- Click task description to edit inline
- Inline due date picker with calendar dropdown
- Inline priority dropdown (P1-P4)
- Auto-save with 500ms debouncing
- Visual feedback during save:
  - Spinner while saving
  - Checkmark on success
  - Error message on failure
- Undo/redo for inline edits (Ctrl+Z / Ctrl+Shift+Z)
- Escape key to cancel edit

**2. Context Menus**

- Right-click context menus for tasks and projects
- Quick actions:
  - Complete Task
  - Archive Task
  - Duplicate Task
  - Move to Project (submenu)
  - Change Priority (submenu)
  - Set Due Date
  - Delete
- Bulk selection with checkboxes
- Keyboard navigation in context menus (arrow keys)
- Keyboard shortcut hints shown in menu items

**3. Drag & Drop Enhancements**

- Drag tasks between projects in sidebar
- Drag files onto tasks for attachment
- Drag subtasks to reorder within task
- Visual drop zones with highlighting
- Ghost preview while dragging
- Snap-to-grid for cleaner alignment

#### Files to Create

- `src/components/ui/inline-edit.tsx` - Reusable inline edit component
- `src/components/ui/context-menu.tsx` - Context menu component (or use Radix UI)

#### Files to Update

- `src/components/tasks/task-card.tsx` - Add inline edit capabilities
- `src/components/tasks/TaskDetailsModal.tsx` - Inline editing for description
- `src/components/projects/ProjectTile.tsx` - Quick edit for project name

#### Success Criteria

- [ ] Double-click triggers inline edit mode
- [ ] Auto-save works reliably with debouncing
- [ ] Context menu appears on right-click
- [ ] All quick actions work from context menu
- [ ] Drag-and-drop between projects works smoothly

---

## Phase 2: Productivity & Time Management

### Sprint 2.1 - Recurring Tasks & Templates

**Priority:** High | **Complexity:** Medium-High | **Duration:** 4-5 days

#### Features

**1. Recurring Tasks**

Create tasks that automatically repeat on a schedule.

**Recurrence Patterns:**

- **Daily:** Every day, every X days
- **Weekly:** Specific days of week (Mon/Wed/Fri)
- **Monthly:**
  - Specific date (e.g., 15th of every month)
  - Relative (e.g., first Monday, last Friday)
- **Yearly:** Annual tasks (birthdays, renewals)
- **Custom:** Every X days/weeks/months

**End Conditions:**

- Never (infinite recurrence)
- After X occurrences (e.g., repeat 10 times)
- By specific date (e.g., end on Dec 31, 2025)

**Features:**

- Skip weekends option
- Auto-generation of next occurrence on completion
- Edit future occurrences:
  - Edit only this occurrence
  - Edit all future occurrences
- Visual indicator on task card showing recurrence pattern
- Recurrence rule displayed in human-readable format

**2. Task Templates**

Save common tasks as reusable templates.

**Features:**

- Save any task as template (with subtasks)
- Personal template library
- Template categories/tags for organization
- Parameterized templates with variables:
  - `{{project_name}}`
  - `{{client_name}}`
  - `{{start_date}}`
  - `{{end_date}}`
- Quick create from template (one-click)
- Pre-made templates included:
  - "Weekly Review"
  - "Client Onboarding"
  - "Bug Fix Workflow"
  - "Content Creation"
  - "Website Launch Checklist"

**3. Project Templates**

Save entire project structures as templates.

**Features:**

- Save project with all tasks as template
- Include task hierarchy and default statuses
- Adjust dates automatically when creating from template
- Predefined project templates:
  - "Website Launch" (15 tasks)
  - "Marketing Campaign" (20 tasks)
  - "Product Sprint" (10 tasks)
  - "Client Project Setup" (8 tasks)
- Clone existing projects as new template

#### Database Changes

**Add to `tasks` table:**

```sql
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN recurrence_rule JSONB; -- RRULE format (RFC 5545)
ALTER TABLE tasks ADD COLUMN recurrence_parent_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN next_occurrence DATE;
```

**Create `task_templates` table:**

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  task_data JSONB NOT NULL, -- Full task structure
  category TEXT,
  subtasks JSONB, -- Array of subtask templates
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Create `project_templates` table:**

```sql
CREATE TABLE project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_data JSONB NOT NULL, -- Full project + tasks structure
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Files to Create

- `src/components/tasks/recurring-task-modal.tsx` - Recurrence rule editor UI
- `src/components/tasks/task-template-modal.tsx` - Template creation/editing
- `src/components/projects/project-template-modal.tsx` - Project template UI
- `src/lib/recurrence-parser.ts` - RRULE parser using `rrule` npm package
- `src/server/trpc/routers/templates.ts` - Template CRUD operations
- `src/server/trpc/routers/recurring.ts` - Recurring task logic

#### Success Criteria

- [ ] Create recurring task with daily/weekly/monthly patterns
- [ ] Next occurrence auto-generates on task completion
- [ ] Save task as template with subtasks
- [ ] Create new task from template with one click
- [ ] Save project as template with all tasks
- [ ] Create project from template with date adjustments

---

### Sprint 2.2 - Calendar View & Scheduling

**Priority:** Very High | **Complexity:** High | **Duration:** 5-7 days

#### Features

**1. Calendar Views**

Multiple view options for different planning needs:

- **Month View:** Traditional calendar with tasks on each date
- **Week View:** Time-blocked hourly grid (8am-8pm)
- **Day View:** Detailed agenda with timeline
- **Multi-day View:** 3-day or work week (Mon-Fri)
- **Year View:** High-level planning (month grid)
- **Mini Calendar:** Date picker for navigation

**2. Drag & Drop Scheduling**

Intuitive scheduling via drag-and-drop:

- Drag tasks from sidebar onto calendar dates
- Drag to reschedule tasks across days/weeks
- Resize task blocks to adjust duration (in week/day view)
- Multi-day tasks spanning across dates
- Drag to adjust time (e.g., 9am → 2pm in day/week view)
- Visual snap-to-grid for 15-minute increments

**3. Calendar Features**

- **Color Coding:**
  - By project (project color)
  - By role (role color)
  - By priority (P1=red, P2=orange, P3=yellow, P4=green)
  - Toggle between color schemes

- **Filtering:**
  - Filter by project
  - Filter by role
  - Filter by status
  - Hide completed tasks toggle

- **Task Types:**
  - All-day events (no specific time)
  - Time-specific tasks (with start/end time)
  - Multi-day tasks (spanning multiple dates)

- **UI Features:**
  - Agenda sidebar showing tasks for selected date
  - Week numbers display
  - Highlight today with distinct color/border
  - Show overdue tasks in red
  - Task count badges on dates (month view)
  - Scrollable timeline (week/day view)

**4. Time Blocking & Scheduling**

- Schedule dedicated focus blocks
- Block time for recurring meetings/commitments
- Automatic conflict detection (overlapping time blocks)
- AI-suggested optimal scheduling based on productivity patterns
- Work hours configuration (e.g., 9am-5pm)

**5. External Calendar Integration**

- **Google Calendar Import:**
  - Import iCal (.ics) file
  - One-way sync (read-only)
  - Map Google Calendar events to all-day tasks
- **Export to .ics:**
  - Export tasks to iCal format
  - Subscribe to feed in external calendar apps
  - Auto-update export (webhook-based)

#### Libraries Consideration

Evaluate these calendar libraries:

- `react-big-calendar` - Most popular, good feature set
- `fullcalendar` - Feature-rich but heavier
- `react-calendar` - Lightweight, good for custom builds
- Custom solution using Tailwind CSS grid

**Recommendation:** Start with `react-big-calendar` for rapid development, customize as needed.

#### Files to Create

- `src/app/(app)/calendar/page.tsx` - Main calendar page
- `src/components/calendar/calendar-view.tsx` - Calendar component wrapper
- `src/components/calendar/month-view.tsx` - Month grid view
- `src/components/calendar/week-view.tsx` - Week timeline view
- `src/components/calendar/day-view.tsx` - Day agenda view
- `src/components/calendar/time-block-editor.tsx` - Time block creation modal
- `src/components/calendar/calendar-sidebar.tsx` - Task sidebar for drag-and-drop
- `src/lib/calendar-utils.ts` - Date manipulation utilities
- `src/server/trpc/routers/calendar.ts` - Calendar-specific queries

#### Success Criteria

- [ ] Month view displays all tasks on correct dates
- [ ] Week view shows time-blocked tasks
- [ ] Drag tasks from sidebar onto dates
- [ ] Resize task blocks to adjust duration
- [ ] Color coding works for project/role/priority
- [ ] Filter by project/role updates view
- [ ] Conflict detection shows warning
- [ ] Export to .ics file works

---

## Phase 3: Enhanced Collaboration Features (Single User)

### Sprint 3.1 - Enhanced Notifications & Activity Feed

**Priority:** Medium | **Complexity:** Low-Medium | **Duration:** 2-3 days

#### Features

**1. Notification Preferences**

- Granular settings per notification type:
  - Task reminders
  - Due date approaching
  - Task completed
  - Project updates
  - AI suggestions
- Email notifications toggle:
  - Real-time (immediate)
  - Daily digest (summary at 8am)
  - Weekly digest (Monday mornings)
- Push notifications (browser + PWA)
- Notification quiet hours (e.g., 10pm-8am)
- Custom notification sounds (select from library)

**2. Rich Notifications**

- Action buttons in notifications:
  - Complete Task
  - Snooze (reschedule)
  - View Details
  - Dismiss
- Grouped notifications:
  - "You completed 5 tasks today! 🎉"
  - "3 tasks are overdue"
- Smart notifications (AI-suggested):
  - Priority-based (high-priority tasks first)
  - Context-aware (relevant to current work)
- Notification history (last 30 days)

**3. Activity Feed Improvements**

- Real-time updates with smooth animations
- Filter by activity type:
  - Created
  - Completed
  - Updated
  - Deleted
  - Status changed
- Search activity history
- Visual timeline view with icons and colors
- Undo recent actions from activity feed (5-minute window)

#### Files to Update

- `src/components/notifications/NotificationPanel.tsx` - Add action buttons
- Create `src/components/notifications/notification-settings.tsx`
- `src/app/(app)/settings/page.tsx` - Add notification preferences section
- `src/components/activity/ActivityFeed.tsx` - Enhanced filtering

#### Success Criteria

- [ ] Notification preferences saved and respected
- [ ] Action buttons in notifications work
- [ ] Activity feed shows real-time updates
- [ ] Undo from activity feed works within 5 minutes

---

### Sprint 3.2 - Task Comments & Rich Notes

**Priority:** Medium | **Complexity:** Low-Medium | **Duration:** 2-3 days

#### Features

**1. Task Comments**

Similar to GitHub issue comments:

- Comment section on every task (below description)
- Rich text editor with markdown support
- Formatting toolbar:
  - Bold, italic, strikethrough
  - Headings (H1-H6)
  - Bullet lists, numbered lists
  - Code blocks with syntax highlighting
  - Blockquotes
  - Links
- File attachments to comments (images, documents)
- Emoji reactions to comments
- Pin important comments (displayed at top)
- Edit/delete own comments
- Comment history with timestamps
- Search across all comments

**2. Quick Notes**

- Quick note field on task (separate from description)
- Voice notes attached to tasks (Plaud integration)
- Screenshot attachments with built-in annotation tools
- Code snippets with language detection and syntax highlighting

**3. Comment Features**

- Automatic save as you type (debounced)
- Comment preview before posting
- Keyboard shortcuts:
  - `Ctrl+B` for bold
  - `Ctrl+I` for italic
  - `Ctrl+K` for link
  - `Ctrl+Enter` to post comment
- Link to other tasks in comments: `#TASK-123`
- Markdown support for technical content

#### Database Changes

**Create `task_comments` table:**

```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB, -- Array of attachment URLs
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at DESC);
```

#### Files to Create

- `src/components/tasks/task-comments.tsx` - Comments list and thread
- `src/components/tasks/comment-editor.tsx` - Rich text editor with markdown
- `src/components/tasks/comment-item.tsx` - Individual comment display

#### Files to Update

- `src/components/tasks/TaskDetailsModal.tsx` - Add comments section at bottom
- `src/server/trpc/routers/comments.ts` - Comment CRUD operations

#### Success Criteria

- [ ] Add comment with markdown formatting
- [ ] Attach files to comments
- [ ] Pin important comments
- [ ] Search comments across all tasks
- [ ] Link to other tasks with #TASK-123 syntax

---

## Phase 4: Advanced Features & Integrations

### Sprint 4.1 - File Attachments for Tasks

**Priority:** Medium | **Complexity:** Low-Medium | **Duration:** 2-3 days

#### Features

**1. Task Attachments**

- Drag & drop files onto task details modal
- Multiple file support (up to 10 files per task)
- File preview capabilities:
  - **Images:** Thumbnail previews with lightbox view
  - **PDFs:** Inline preview using pdf.js
  - **Text files:** Inline preview with syntax highlighting
  - **Documents:** Download only (Word, Excel, PPT)
- File version history (track updates to same filename)
- Download individual files
- Download all attachments as ZIP
- Delete individual attachments
- File size limits: 10MB per file, 100MB per task
- Supported formats:
  - Images: PNG, JPG, GIF, WebP, SVG
  - Documents: PDF, DOCX, XLSX, PPTX
  - Code: JS, TS, PY, JSON, MD, TXT
  - Archives: ZIP, RAR (download only)

**2. Storage & Optimization**

- Continue using Vercel Blob storage
- Automatic image compression (75% quality JPEG)
- Thumbnail generation for images (200x200px)
- CDN delivery for fast global loading
- Lazy loading for attachment previews
- Progressive image loading (blur-up technique)

**3. Attachment Management**

- Attachment library view (all files across all tasks)
- Search attachments by filename
- Filter by file type
- Sort by date, size, name
- Bulk delete attachments

#### Database Changes

**Create `task_attachments` table:**

```sql
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL, -- Vercel Blob URL
  thumbnail_url TEXT, -- For images
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
```

#### Files to Create

- `src/components/tasks/task-attachments.tsx` - Attachments grid display
- `src/components/tasks/file-uploader.tsx` - Drag-and-drop upload component
- `src/components/ui/file-preview.tsx` - File preview modal with lightbox
- `src/lib/file-utils.ts` - File type detection and formatting utilities

#### Files to Update

- `src/components/tasks/TaskDetailsModal.tsx` - Add attachments section
- `src/server/trpc/routers/attachments.ts` - Create new router for file operations
- `src/app/api/upload/route.ts` - File upload endpoint (Vercel Blob)

#### Success Criteria

- [ ] Drag and drop files onto task modal
- [ ] Image previews load with thumbnails
- [ ] PDF inline preview works
- [ ] Download all as ZIP works
- [ ] File size limits enforced
- [ ] Attachment library shows all files

---

### Sprint 4.2 - Advanced Search & Saved Views

**Priority:** High | **Complexity:** Medium | **Duration:** 3-4 days

#### Features

**1. Advanced Filters**

Build complex queries with multiple criteria:

- **Filter by Status:**
  - Not Started, In Progress, Blocked, Completed
  - Content, Design, Dev, QA, Launch
  - Multiple selection (OR logic)

- **Filter by Priority:**
  - P1 (Highest)
  - P2 (High)
  - P3 (Medium)
  - P4 (Low)

- **Filter by Role:**
  - Select from user's roles
  - Multiple selection

- **Filter by Date Ranges:**
  - Created date
  - Due date
  - Completed date
  - Custom date range picker

- **Text Search:**
  - Search in title
  - Search in description
  - Search in comments
  - Full-text search with fuzzy matching

- **Boolean Operators:**
  - AND: All conditions must match
  - OR: Any condition must match
  - NOT: Exclude matching items

- **Filter Combinations:**
  - Save complex filter combinations
  - Quick filter presets (buttons)
  - Filter history (last 10 searches)

**2. Saved Views**

Create and manage custom views:

- Save filtered views with custom names
- Quick access dropdown in topbar
- Per-page saved views:
  - Board view
  - Dashboard view
  - Calendar view
  - List view
- Set default view per page
- Share views via URL (query params)
- Duplicate views to create variations

**Smart Views (Pre-configured):**

- **My Focus:** Due today + P1/P2 priority
- **Overdue:** Past due date + not completed
- **This Week:** Due in next 7 days
- **Next Week:** Due in 8-14 days
- **Blocked:** Status = blocked
- **No Due Date:** Tasks without due dates
- **Quick Wins:** P3/P4 + no blocking dependencies
- **In Progress:** Status = in_progress
- **Needs Review:** Status = qa or client_review

**3. Search Improvements**

- **Search History:** Last 10 searches with timestamps
- **Search Suggestions:** Based on recent activity and popular searches
- **Fuzzy Matching:** Handle typos gracefully
- **Search Scoping:**
  - Search within specific project
  - Search within date range
  - Search within status
- **Results Display:**
  - Grouped by type (tasks, projects, notes)
  - Highlighted search terms
  - Result count per category
  - Keyboard navigation (arrow keys)
  - Quick preview on hover (tooltip)
  - Click to open full details

#### Database Changes

**Create `saved_views` table:**

```sql
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  view_type TEXT NOT NULL, -- 'board', 'dashboard', 'calendar', 'list'
  filters JSONB NOT NULL, -- Filter criteria object
  sort_by TEXT,
  sort_order TEXT CHECK (sort_order IN ('asc', 'desc')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_views_user_id ON saved_views(user_id);
CREATE INDEX idx_saved_views_view_type ON saved_views(view_type);
```

#### Files to Create

- `src/components/search/advanced-search-builder.tsx` - Filter builder UI
- `src/components/search/saved-views-manager.tsx` - Saved views CRUD
- `src/components/search/quick-filters.tsx` - Smart view buttons
- `src/components/search/filter-chip.tsx` - Active filter display chips
- `src/lib/search-utils.ts` - Search query parsing and formatting

#### Files to Update

- `src/components/search/CommandPalette.tsx` - Enhanced search with filters
- `src/server/trpc/routers/search.ts` - Add advanced search endpoint
- `src/server/trpc/routers/views.ts` - Create new router for saved views

#### Success Criteria

- [ ] Build multi-criteria search query
- [ ] Save custom view with name
- [ ] Set default view for board page
- [ ] Smart views show correct filtered results
- [ ] Search history persists across sessions
- [ ] Fuzzy search finds results with typos

---

### Sprint 4.3 - Slack Integration (Simplified)

**Priority:** High | **Complexity:** Medium | **Duration:** 3-4 days

#### Features

**Scope:** Task creation and management from Slack only. No notifications to Slack, no project channel integration.

**1. Slack Slash Commands**

Bot commands for task management:

- `/task create [project] [title]` - Create new task
  - Example: `/task create Website Fix login bug`
  - Opens modal for additional details (description, priority, due date)

- `/task list [project]` - List tasks in project
  - Example: `/task list Website`
  - Shows tasks grouped by status
  - Displays first 10, with "View More" link

- `/task complete [task-id]` - Mark task complete
  - Example: `/task complete TASK-123`
  - Shows success message with confetti emoji

- `/task search [query]` - Search tasks
  - Example: `/task search login bug`
  - Returns top 5 matching tasks

- `/task today` - Show today's tasks
  - Lists all tasks due today
  - Grouped by project

- `/task overdue` - Show overdue tasks
  - Lists all overdue incomplete tasks
  - Sorted by due date (oldest first)

**2. Interactive Messages**

Rich task cards in Slack with action buttons:

**Task Card Format:**

```
📋 Task: Fix login bug
Project: Website | Priority: P1 | Due: Oct 31
Status: In Progress

Description:
Users reporting login issues on mobile devices...

[Complete] [View Details] [Edit]
```

**Features:**

- Task title with emoji based on status
- Project name, priority, due date
- Truncated description (first 100 chars)
- Action buttons:
  - **Complete** - Marks task complete
  - **View Details** - Opens app in browser
  - **Edit** - Opens edit modal in Slack
- Task updates reflected in original message

**3. Message to Task Conversion**

Convert Slack messages into tasks:

**Method 1: Emoji Reaction**

- React with :memo: emoji to any message
- Bot sends ephemeral message: "Create task from this message?"
- Confirm to create task with message content
- Auto-populate:
  - Title: First line of message
  - Description: Full message content
  - Link back to Slack message (deep link)

**Method 2: Message Action**

- Right-click message → Apps → TaskTracker → Create Task
- Opens modal with pre-filled content
- Select project, priority, due date
- Submit to create

**Features:**

- Preserve message formatting (markdown)
- Include message author as note
- Link back to original Slack thread
- Attach message images to task

#### Implementation

**OAuth Flow:**

1. User clicks "Connect Slack" in settings
2. Redirects to Slack OAuth page
3. User authorizes workspace access
4. Bot installed to workspace
5. Tokens stored encrypted in database

**Slash Command Handling:**

1. Slack sends POST to webhook endpoint
2. Validate request signature
3. Parse command and parameters
4. Execute tRPC mutation
5. Return formatted response to Slack

**Interactive Button Handling:**

1. User clicks button in Slack
2. Slack sends interaction payload
3. Validate and parse payload
4. Execute action (complete task, etc.)
5. Update message in Slack

**Security:**

- Validate Slack request signatures
- Encrypt tokens at rest (AES-256)
- Rate limiting: 60 requests/minute per user
- Audit logging for all Slack actions
- Scope permissions: `commands`, `chat:write`, `users:read`

#### Database Changes

**Create `slack_integrations` table:**

```sql
CREATE TABLE slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  bot_token TEXT NOT NULL, -- Encrypted
  bot_user_id TEXT NOT NULL,
  webhook_url TEXT,
  connected_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_slack_integrations_user_id ON slack_integrations(user_id);
```

**Add to `tasks` table:**

```sql
ALTER TABLE tasks ADD COLUMN slack_message_id TEXT;
ALTER TABLE tasks ADD COLUMN slack_channel_id TEXT;
ALTER TABLE tasks ADD COLUMN slack_thread_ts TEXT;
```

#### Files to Create

**Server-side:**

- `src/server/integrations/slack/commands.ts` - Slash command handlers
- `src/server/integrations/slack/actions.ts` - Interactive button handlers
- `src/server/integrations/slack/events.ts` - Event handlers (message reactions)
- `src/server/integrations/slack/oauth.ts` - OAuth flow logic
- `src/server/integrations/slack/utils.ts` - Slack API utilities
- `src/lib/encryption.ts` - Token encryption/decryption

**API Routes:**

- `src/app/api/integrations/slack/oauth/route.ts` - OAuth callback
- `src/app/api/integrations/slack/commands/route.ts` - Slash command webhook
- `src/app/api/integrations/slack/interactions/route.ts` - Button interactions
- `src/app/api/integrations/slack/events/route.ts` - Event subscriptions

**Client-side:**

- `src/app/(app)/settings/integrations/page.tsx` - Slack connection UI
- `src/components/integrations/slack-connect.tsx` - OAuth button
- `src/components/integrations/slack-status.tsx` - Connection status display

**tRPC Router:**

- `src/server/trpc/routers/integrations.ts` - Integration management endpoints

#### Libraries/Dependencies

```json
{
  "@slack/bolt": "^3.17.0",
  "@slack/web-api": "^6.10.0"
}
```

#### Success Criteria

- [ ] Connect Slack workspace via OAuth
- [ ] `/task create` command works
- [ ] `/task list` shows tasks from project
- [ ] `/task complete` marks task done
- [ ] React with :memo: creates task
- [ ] Task card displays in Slack with buttons
- [ ] Complete button updates task and message
- [ ] Rate limiting prevents abuse
- [ ] Tokens encrypted in database

---

## Phase 5: Data Visualization & AI

### Sprint 5.1 - Advanced Analytics Dashboard

**Priority:** Medium-High | **Complexity:** Medium-High | **Duration:** 5-7 days

#### Features

**1. Productivity Metrics**

Charts and insights for personal productivity:

- **Tasks Completed Over Time**
  - Line chart showing daily/weekly/monthly completions
  - Trend line showing acceleration/deceleration
  - Goal line (target tasks per day)
  - Interactive: hover for exact counts, click to drill down

- **Completion Rate by Project/Role**
  - Horizontal bar chart
  - Shows completion % per project
  - Color-coded by health (green >80%, yellow 50-80%, red <50%)
  - Sort by completion rate or task count

- **Average Task Duration**
  - Gauge chart showing avg completion time
  - Breakdown by priority level
  - Comparison to previous period
  - Helps calibrate estimates

- **Velocity Trend**
  - Line chart: tasks per week over time
  - Moving average (4-week)
  - Burndown/burnup for active projects
  - Forecast future velocity

- **Time Distribution**
  - Donut chart: hours by project
  - Breakdown by role/category
  - Filter by date range
  - Export as CSV

- **Completion Streak**
  - Current streak (consecutive days with completed tasks)
  - Longest streak all-time
  - Calendar heatmap (GitHub-style)
  - Gamification element

**2. Project Analytics**

Per-project insights:

- **Project Health Scores**
  - Algorithm:
    - Overdue tasks: -10 points each
    - Blocked tasks: -5 points each
    - Velocity vs target: ±20 points
    - Score: 0-100 scale
  - Color indicators: Green (>70), Yellow (40-70), Red (<40)

- **At-Risk Projects**
  - Auto-detection criteria:
    - > 20% tasks overdue
    - > 3 tasks blocked for >5 days
    - Velocity declining for 2+ weeks
  - Alert badge with warning icon
  - Recommended actions from AI

- **Project Progress Over Time**
  - Cumulative flow diagram
  - Stacked area chart by status
  - Identify bottlenecks (status with longest duration)

- **Time Spent Per Project**
  - Weekly comparison bar chart
  - Stacked by task type
  - Budget vs actual (if time tracking enabled)

- **Project Completion Forecast**
  - Based on current velocity
  - Confidence intervals (optimistic, realistic, pessimistic)
  - Critical path analysis
  - Suggest acceleration strategies

**3. Personal Insights**

Patterns and self-awareness:

- **Most Productive Hours**
  - Heatmap: days of week × hours of day
  - Based on task completion times
  - Darker = more productive
  - Helps schedule hard tasks

- **Most Productive Days of Week**
  - Bar chart: Mon-Sun task counts
  - Best day vs worst day comparison
  - Pattern recognition for planning

- **Task Completion by Priority**
  - Stacked bar chart: P1-P4 over time
  - Shows if focusing on right priorities
  - Completion rate per priority level

- **Average Time to Completion by Role**
  - Compare estimated vs actual
  - Identify underestimated categories
  - Improve future estimates

**4. Visual Elements**

Use Recharts library (built on D3):

- **Interactive Charts:**
  - Hover tooltips with detailed data
  - Click to drill down
  - Pan and zoom (timeline charts)
  - Export as PNG/SVG

- **Burndown/Burnup Charts:**
  - For projects with deadlines
  - Ideal vs actual progress
  - Scope change indicators

- **Cumulative Flow Diagrams:**
  - Stacked area: tasks by status over time
  - Identify bottlenecks (expanding areas)
  - Flow efficiency metrics

- **Heatmaps:**
  - GitHub-style contribution calendar
  - Productivity by hour/day
  - Color scales with legends

- **Sparklines:**
  - Inline mini-charts in tables
  - Quick visual trends
  - Space-efficient

**5. Date Range Selector**

- Presets: Today, This Week, This Month, This Quarter, This Year
- Custom range picker
- Compare periods (e.g., this week vs last week)

#### Files to Create

- `src/app/(app)/analytics/page.tsx` - Main analytics dashboard
- `src/components/analytics/productivity-chart.tsx` - Tasks over time
- `src/components/analytics/completion-rate-chart.tsx` - Bar chart by project
- `src/components/analytics/velocity-chart.tsx` - Velocity trend line
- `src/components/analytics/project-health.tsx` - Health score cards
- `src/components/analytics/time-heatmap.tsx` - Hour/day heatmap
- `src/components/analytics/cumulative-flow.tsx` - CFD chart
- `src/components/analytics/date-range-picker.tsx` - Range selector
- `src/lib/analytics-utils.ts` - Data aggregation utilities

#### Files to Update

- `src/server/trpc/routers/analytics.ts` - Enhance with new queries
- Add aggregation queries for all metrics

#### Dependencies

```json
{
  "recharts": "^2.10.0",
  "date-fns": "^2.30.0"
}
```

#### Success Criteria

- [ ] Tasks completed chart shows accurate data
- [ ] Project health scores calculated correctly
- [ ] Heatmap shows productivity patterns
- [ ] Velocity trend displays with moving average
- [ ] Date range selector filters all charts
- [ ] Charts are interactive (hover, click)
- [ ] Export chart as PNG works

---

### Sprint 5.2 - AI Insights & Recommendations

**Priority:** Very High | **Complexity:** High | **Duration:** 7-10 days

#### Features

**1. Smart Insights Panel**

AI-powered productivity insights:

**Pattern Detection:**

- "You complete most tasks on Wednesday mornings (9-11am)"
- "Your productivity peaks at 10am, drops after 2pm"
- "You're 40% more productive on tasks tagged 'bug fix'"
- "Monday mornings are your least productive time"

**Bottleneck Identification:**

- "Tasks in 'QA' status take 2x longer than expected"
- "You have 5 tasks blocked for >5 days - time to unblock?"
- "'Design' tasks average 3 days longer than estimated"

**Project Completion Prediction:**

- "Project X likely to finish 3 days late based on current velocity"
- "At current pace, you'll complete 8 tasks this week (goal: 10)"
- "Project Y is ahead of schedule - consider starting next phase"

**Risk Assessment:**

- "5 high-priority tasks due tomorrow - consider rescheduling"
- "You have 12 tasks 'In Progress' - focus on completing existing work?"
- "3 projects have no activity for 7+ days - archive or resume?"

**Anomaly Detection:**

- "Task ABC is taking unusually long (5 days vs 2-hour average for similar tasks)"
- "You completed only 2 tasks this week (average: 8)"
- "Unusual spike in task creation - are you overwhelmed?"

**2. Proactive Recommendations**

AI suggests actionable improvements:

**Estimation Accuracy:**

- "You tend to overestimate 'bug fix' tasks by 40% - adjust estimates"
- "Your 'feature' tasks consistently take 2x longer than estimated"
- "Consider using smaller time blocks for better accuracy"

**Task Management:**

- "Consider breaking this task into subtasks (high complexity detected)"
- "This task has been 'In Progress' for 14 days - set a deadline?"
- "5 tasks have no due date - schedule them to prevent forgetting"

**Project Health:**

- "Project X is at risk of missing deadline - prioritize these 3 critical tasks"
- "Project Y has 8 blocked tasks - hold a meeting to unblock"
- "Consider archiving Project Z (no activity in 30 days)"

**Scheduling Optimization:**

- "You're most productive 9am-11am - schedule hard tasks then"
- "You haven't taken a break in 3 hours - time for a pomodoro break"
- "Friday afternoons are low-productivity - schedule light tasks"

**Work-Life Balance:**

- "You've worked 12 hours today - consider calling it a day"
- "You haven't taken a day off in 3 weeks - schedule rest"
- "Average work session: 4 hours - consider shorter, more frequent breaks"

**3. Natural Language Queries (Chat Interface)**

AI-powered chat for asking questions:

**Query Examples:**

- "Which projects are behind schedule?"
  - AI: "2 projects are behind: Website (3 days late) and Marketing Campaign (1 day late)"

- "How much time did I spend on Project X this week?"
  - AI: "You spent 12.5 hours on Project X this week (Mon-Fri)"

- "What should I work on next?"
  - AI: "Based on priority and due dates, I recommend: 1) Fix login bug (P1, due today), 2) Design homepage (P2, due tomorrow)"

- "Why is this task taking so long?"
  - AI: "This task has been in progress for 8 days. Similar tasks usually take 2-3 days. Possible reasons: blocked dependencies, scope creep, or complexity underestimated."

- "Create a task for fixing the login bug"
  - AI: "Task created: 'Fix login bug' in Project: Website, Priority: P1, Due: Today"

- "Show me all blocked tasks"
  - AI: Lists all blocked tasks with reasons and durations

**Chat Features:**

- Persistent chat history
- Context-aware (remembers conversation)
- Quick action buttons in responses
- Voice input support (browser API)
- Export chat transcript

**4. Predictive Features**

Machine learning for forecasting:

**Task Completion Time Prediction:**

- Train ML model on user's historical task data
- Features: title length, description length, priority, role, subtask count, similar tasks
- Predict completion time with confidence interval
- Update estimates based on actual performance
- Show prediction when creating new tasks

**Project End Date Forecast:**

- Based on current velocity
- Factor in holidays, weekends
- Multiple scenarios:
  - Optimistic (20% faster velocity)
  - Realistic (current velocity)
  - Pessimistic (20% slower velocity)
- Confidence intervals (±X days)

**Delay Prediction:**

- Predict which tasks likely to be delayed
- Risk factors:
  - Complexity indicators (long description, many subtasks)
  - Historical delays on similar tasks
  - Current workload
  - Dependencies
- Suggest mitigation strategies

**Similar Task Identification:**

- Find tasks similar to current task
- Show actual completion time for similar tasks
- Use for better estimation
- Algorithm: TF-IDF + cosine similarity on title/description

**5. AI Learning System**

Continuous improvement through user feedback:

- **Feedback Mechanism:**
  - Thumbs up/down on insights
  - "This helped" / "Not useful" buttons
  - Comment field for specific feedback

- **Adaptive Recommendations:**
  - Adjust suggestion frequency based on acceptance rate
  - Learn from dismissed suggestions
  - Personalize to user's work style

- **Privacy-First:**
  - All learning data stays in user's account
  - No cross-user training (single-tenant AI)
  - Opt-out option in settings

- **Transparency:**
  - Show confidence scores on predictions
  - Explain reasoning: "Based on 50 similar tasks..."
  - Allow manual overrides

#### Implementation

**AI Models:**

1. **Pattern Detection:**
   - Time-series analysis (completion patterns)
   - Statistical clustering (group similar tasks)

2. **Prediction:**
   - Random Forest Regressor (time prediction)
   - Linear Regression (velocity forecasting)

3. **Natural Language:**
   - OpenAI GPT-4 for chat interface
   - Function calling for tool use
   - LangChain for query parsing

4. **Similar Tasks:**
   - TF-IDF vectorization
   - Cosine similarity scoring

**Data Pipeline:**

1. Aggregate historical task data
2. Feature engineering (extract signals)
3. Train/update models weekly
4. Store model weights in database
5. Run inference on-demand

#### Database Changes

**Create `ai_insights` table:**

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'pattern', 'recommendation', 'risk', 'prediction'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
  actionable BOOLEAN DEFAULT FALSE,
  action_data JSONB, -- Action buttons/links
  dismissed BOOLEAN DEFAULT FALSE,
  feedback INTEGER, -- -1 (negative), 0 (neutral), 1 (positive)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_dismissed ON ai_insights(dismissed) WHERE NOT dismissed;
```

**Create `ai_chat_history` table:**

```sql
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_user_id ON ai_chat_history(user_id, created_at DESC);
```

#### Files to Create

**AI Engine:**

- `src/lib/ai/pattern-analyzer.ts` - Pattern detection algorithms
- `src/lib/ai/insights-engine.ts` - Insight generation logic
- `src/lib/ai/prediction-model.ts` - ML prediction models
- `src/lib/ai/chat-interface.ts` - Natural language query handler
- `src/lib/ai/similarity-engine.ts` - Find similar tasks

**Components:**

- `src/components/ai/ai-insights-panel.tsx` - Insights widget
- `src/components/ai/insight-card.tsx` - Individual insight display
- `src/components/ai/ai-chat.tsx` - Chat interface
- `src/components/ai/chat-message.tsx` - Chat message component
- `src/components/ai/prediction-badge.tsx` - Show predicted time on tasks

**Pages:**

- `src/app/(app)/ai-assistant/page.tsx` - Full AI assistant page with chat

**tRPC Router:**

- `src/server/trpc/routers/ai.ts` - AI endpoints (insights, chat, predictions)

#### Dependencies

```json
{
  "openai": "^4.20.0",
  "langchain": "^0.0.200",
  "@tensorflow/tfjs": "^4.13.0",
  "natural": "^6.8.0"
}
```

#### Success Criteria

- [ ] Insights panel shows relevant patterns
- [ ] Chat responds to natural language queries
- [ ] Task completion time prediction accurate within ±20%
- [ ] Similar tasks identified correctly
- [ ] Recommendations actionable and helpful
- [ ] Feedback improves suggestion quality
- [ ] AI learning respects privacy (single-tenant)

---

## Implementation Priority Matrix

### Phase 6: Personal Growth Features

We will expand the application to support personal development through structured goal setting and habit tracking. These features will live under a new "Personal" sidebar category.

### Sprint 6.1: Personal Goals Tracking

**Objective:** Create a dedicated space for long-term aspirations linked to actionable projects.

#### Features

1.  **Goals Dashboard**
    -   Card-based view of active goals
    -   Progress bars and status indicators
    -   Filter by category (Career, Health, Finance, Personal, etc.)

2.  **Goal Management**
    -   Create/Edit/Delete goals
    -   Link goals to existing Projects (optional)
    -   Set target dates and milestones

3.  **Database Schema**
    -   New `goals` table with fields for progress, status, and category

#### Files to Create

-   `src/app/(app)/goals/page.tsx` - Main goals dashboard
-   `src/components/goals/goal-card.tsx` - Individual goal display
-   `src/components/goals/goal-form-modal.tsx` - Create/Edit modal
-   `src/server/trpc/routers/goals.ts` - tRPC router for goal operations
-   `src/server/db/schema/goals.ts` - Drizzle schema definition

#### Files to Update

-   `src/components/layout/sidebar.tsx` - Add "Personal" group with "Goals" item
-   `src/server/trpc/root.ts` - Register new router

---

### Sprint 6.2: Daily Success Habits

**Objective:** Build consistency with a simple, effective daily habit tracker.

#### Features

1.  **Habit Tracker Interface**
    -   Daily checklist view
    -   Visual completion streaks (heatmap or fire icon)
    -   Quick toggle for "Today's" completion

2.  **Habit Management**
    -   Define habits with frequency (Daily, Weekly)
    -   Set preferred time of day (Morning, Evening)
    -   Archive old habits

3.  **Analytics (Basic)**
    -   Current streak count
    -   Weekly completion rate

4.  **Database Schema**
    -   New `habits` table for definitions
    -   New `habit_logs` table for daily completion records

#### Files to Create

-   `src/app/(app)/habits/page.tsx` - Main habit tracker page
-   `src/components/habits/habit-list.tsx` - Daily checklist component
-   `src/components/habits/habit-stats.tsx` - Streak and progress visualization
-   `src/server/trpc/routers/habits.ts` - tRPC router for habits
-   `src/server/db/schema/habits.ts` - Drizzle schema definition

#### Files to Update

-   `src/components/layout/sidebar.tsx` - Add "Habits" item to "Personal" group
-   `src/server/trpc/root.ts` - Register new router

---

### 🔥 Immediate Priority (Weeks 1-2)

**Start Here - Maximum Impact**

1. ⭐ **Mobile Kanban Status Picker + Footer Nav (Sprint 1.4)** - CRITICAL
   - Mobile experience is broken without this
   - Highest user pain point
   - Enables mobile productivity

2. **Keyboard Shortcuts (Sprint 1.3)**
   - Power users need this immediately
   - Low effort, high impact
   - Works across entire app

3. **Dark Mode (Sprint 1.1)**
   - Many users prefer dark mode
   - Quick win for user satisfaction
   - Foundation for theme system

4. **Enhanced Animations (Sprint 1.2)**
   - Makes app feel premium
   - Improves perceived performance
   - Low effort, high delight

5. **Inline Editing (Sprint 1.5)**
   - Reduces clicks and friction
   - Faster task updates
   - Better UX

### 🎯 High Priority (Weeks 3-6)

**Core Productivity Features**

1. **Calendar View (Sprint 2.2)**
   - Essential for scheduling
   - Visualize workload
   - Time blocking capability

2. **Recurring Tasks (Sprint 2.1)**
   - Automates repetitive work
   - Major time saver
   - Templates increase efficiency

3. **Slack Integration (Sprint 4.3)**
   - Meets where users already work
   - Reduces context switching
   - Quick task capture

4. **Advanced Search (Sprint 4.2)**
   - Find anything quickly
   - Saved views for workflows
   - Power user feature

### 📈 Medium Priority (Weeks 7-10)

**Enhanced Capabilities**

1. **File Attachments (Sprint 4.1)**
   - Context on tasks
   - Reference materials
   - Collaboration enabler

2. **Task Comments (Sprint 3.2)**
   - Rich context
   - Decision history
   - Thinking out loud

3. **Notifications (Sprint 3.1)**
   - Never miss deadlines
   - Actionable alerts
   - Reduced overwhelm

4. **Analytics (Sprint 5.1)**
   - Data-driven insights
   - Track progress
   - Identify patterns

### 🚀 Long-term Goals (Weeks 11+)

**Advanced Intelligence**

1. **AI Insights (Sprint 5.2)**
   - Proactive assistance
   - Predictive capabilities
   - Learn from behavior

2. **Additional Integrations**
   - Google Calendar sync
   - GitHub issue sync
   - Email to task

3. **Mobile App**
   - Native iOS/Android (React Native)
   - Offline-first architecture
   - Push notifications

---

## Removed Features

### ❌ Not Included (Per Requirements)

**Explicitly Removed:**

- **Time Tracking System (Original Sprint 2.1)** - Complexity vs value, not primary use case
- **Pomodoro Timer (Original Sprint 2.2)** - Niche feature, users can use external timers
- **Tags & Custom Fields (Original Sprint 4.2)** - Roles already provide categorization
- **Slack Notifications to User** - Keep integration simple, focus on task creation
- **Slack Project Channel Integration** - Scope creep, not core value
- **Gantt Charts** - Too complex for solo user, overkill for personal productivity
- **Team/Multi-User Features** - Workspace model, assignments, team workload
- **Enterprise Features** - SSO, audit logs, compliance, billing
- **Export Features** - CSV/PDF exports (no clear use case)
- **Budget & Invoicing** - Not a project management need for personal use

---

## Technical Implementation Notes

### Architecture Decisions

**1. Mobile Detection Strategy**

```typescript
// Use CSS media query for reliable touch detection
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

// Alternative: User agent check as fallback
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Recommended: Combine both for accuracy
const isMobileDevice = isTouchDevice || isMobile;
```

**2. Bottom Sheet Implementation**

- Use Radix UI Dialog with custom animations
- Transform: translateY(100%) → translateY(0)
- Backdrop blur: backdrop-filter: blur(8px)
- iOS safe area: padding-bottom: env(safe-area-inset-bottom)

**3. Keyboard Shortcut System**

- Global event listener on `document`
- Check `event.target` to avoid triggering in input fields
- Support sequence shortcuts (G then D)
- Handle OS detection for Ctrl vs Cmd

**4. Calendar Integration**

- Use `react-big-calendar` as base
- Custom toolbar for better UX
- Integrate with existing task query system
- Store calendar view preference in localStorage

**5. AI Model Training**

- Train models server-side (Next.js API routes)
- Store model weights in database (JSONB column)
- Use TensorFlow.js for inference
- Fallback to rule-based when insufficient data

### Performance Optimizations

**1. Virtual Scrolling**

- Implement for lists >100 items
- Use `react-window` or `react-virtual`
- Lazy load images with Intersection Observer

**2. Code Splitting**

- Dynamic imports for heavy components (calendar, charts)
- Route-based splitting (already done by Next.js)
- Lazy load AI components until needed

**3. Database Indexing**

```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date) WHERE NOT archived;
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE NOT archived;
CREATE INDEX idx_tasks_weekly ON tasks(user_id, week_of) WHERE NOT archived;
```

**4. Caching Strategy**

- React Query: 30s staleTime (existing)
- Memoize expensive calculations with `useMemo`
- Cache AI predictions for 1 hour
- Use SWR pattern for background updates

### Security Considerations

**1. Slack Integration**

```typescript
// Validate Slack request signatures
import crypto from 'crypto';

function verifySlackRequest(request: Request, signingSecret: string): boolean {
  const timestamp = request.headers.get('x-slack-request-timestamp');
  const signature = request.headers.get('x-slack-signature');
  const body = await request.text();

  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  const computedSignature = `v0=${hmac.update(baseString).digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}
```

**2. Token Encryption**

```typescript
// Use AES-256-GCM for Slack tokens
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}
```

**3. Rate Limiting**

- Implement per-user rate limiting on AI endpoints
- Use Redis or in-memory store (Upstash)
- Limits:
  - AI chat: 20 requests/hour
  - Slack commands: 60 requests/hour
  - Search: 100 requests/hour

### Testing Strategy

**1. Unit Tests (Vitest)**

- Test utility functions (date-utils, keyboard-utils)
- Test hooks (useKeyboardShortcuts, useTouchDevice)
- Test AI logic (pattern-analyzer, insights-engine)

**2. Integration Tests**

- Test tRPC routers with mock database
- Test Slack integration with mock Slack API
- Test file upload flow

**3. E2E Tests (Playwright)**

- Critical user flows:
  - Create task on mobile → Change status via bottom sheet
  - Use keyboard shortcuts to navigate and create tasks
  - Connect Slack → Create task via slash command
  - Search and save view
- Mobile-specific tests (viewport resize)

**4. Visual Regression (Chromatic or Percy)**

- Snapshot test all components in light/dark mode
- Mobile and desktop viewports
- Catch unintended styling changes

### Monitoring & Observability

**1. Error Tracking (Sentry)**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**2. Performance Monitoring**

- Vercel Analytics (Web Vitals)
- Custom metrics:
  - Time to first task load
  - Calendar render time
  - Search response time
  - AI prediction latency

**3. User Analytics (PostHog or Mixpanel)**

- Track feature adoption:
  - % users using keyboard shortcuts
  - % users on mobile
  - Most-used Slack commands
  - Most-saved views

**4. Logging (Better Stack or Axiom)**

- Structured logging with context
- Log levels: error, warn, info, debug
- Include user ID, request ID, timestamp
- Searchable and filterable

---

## Estimated Timeline

### Phase-by-Phase Breakdown

**Phase 1: Premium UI/UX Polish**

- Sprint 1.1 (Dark Mode): 2-3 days
- Sprint 1.2 (Animations): 2-3 days
- Sprint 1.3 (Keyboard Shortcuts): 2-3 days
- Sprint 1.4 (Mobile Overhaul): 3-5 days
- Sprint 1.5 (Inline Editing): 2-3 days
- **Total: 11-17 days (2-3 weeks)**

**Phase 2: Productivity Features**

- Sprint 2.1 (Recurring Tasks): 4-5 days
- Sprint 2.2 (Calendar View): 5-7 days
- **Total: 9-12 days (2-3 weeks)**

**Phase 3: Enhanced Features**

- Sprint 3.1 (Notifications): 2-3 days
- Sprint 3.2 (Comments): 2-3 days
- **Total: 4-6 days (1 week)**

**Phase 4: Integrations & Advanced**

- Sprint 4.1 (File Attachments): 2-3 days
- Sprint 4.2 (Advanced Search): 3-4 days
- Sprint 4.3 (Slack Integration): 3-4 days
- **Total: 8-11 days (2 weeks)**

**Phase 5: Analytics & AI**

- Sprint 5.1 (Analytics): 5-7 days
- Sprint 5.2 (AI Insights): 7-10 days
- **Total: 12-17 days (3-4 weeks)**

### Grand Total

**11-16 weeks (2.5-4 months)** for complete roadmap

### Realistic Schedule (with buffer)

- **Month 1:** Phase 1 (UI/UX Polish)
- **Month 2:** Phase 2 (Productivity) + Phase 3 (Enhanced)
- **Month 3:** Phase 4 (Integrations)
- **Month 4:** Phase 5 (Analytics & AI)

### MVP Scope (Launch in 6 weeks)

If prioritizing for fastest launch:

1. Mobile Kanban Fix (1.4) - Week 1
2. Keyboard Shortcuts (1.3) - Week 1
3. Dark Mode (1.1) - Week 2
4. Recurring Tasks (2.1) - Week 3
5. Calendar View (2.2) - Week 4-5
6. Slack Integration (4.3) - Week 6

---

## Success Metrics

### User Engagement

- **Daily Active Usage:** Track daily sessions
- **Session Duration:** Average time per session (target: 30+ minutes)
- **Tasks Created/Completed per Day:** Productivity indicator (target: 8+ tasks/day)
- **Feature Adoption Rates:**
  - % users enabling dark mode (target: 60%)
  - % users using keyboard shortcuts (target: 40%)
  - % mobile users using status picker (target: 90%)
  - % users with saved views (target: 50%)

### Performance

- **Page Load Time:** < 2s (p95)
- **Time to Interactive:** < 3s
- **API Response Time:** < 200ms (p95)
- **Mobile Performance Score:** > 90 (Lighthouse)
- **Calendar Render Time:** < 1s for 100 tasks

### Quality

- **Bug Rate:** < 5% per release
- **Zero Critical Bugs:** No showstoppers in production
- **User Satisfaction:** Self-assessment surveys (target: 8+/10)
- **Feature Request Velocity:** Time from request to implementation

### AI Performance

- **Prediction Accuracy:** Task completion time within ±20% (target: 70% accuracy)
- **Insight Helpfulness:** Positive feedback rate (target: 60%)
- **Chat Response Quality:** Successful query resolution rate (target: 80%)

---

## Next Steps & Action Items

### Immediate Actions (This Week)

1. ✅ **Finalize Roadmap**
   - Review and approve feature list
   - Confirm priorities
   - Sign off on timeline

2. **Set Up Project Management**
   - Create GitHub project board with columns:
     - Backlog
     - Sprint Planning
     - In Progress
     - In Review
     - Done
   - Add all sprints as issues
   - Assign story points

3. **Environment Setup**
   - Ensure all dependencies updated
   - Set up testing framework (Vitest, Playwright)
   - Configure Sentry for error tracking
   - Set up analytics (PostHog)

4. **Create Sprint 1.4 Implementation Plan**
   - Detailed technical design document
   - Component mockups (Figma)
   - API endpoint specifications
   - Database migration scripts

### Sprint Planning

**Sprint 1 (Week 1-2): Mobile Critical + Quick Wins**

- 1.4: Mobile Kanban Status Picker + Footer Nav (5 days)
- 1.3: Keyboard Shortcuts (3 days)
- 1.1: Dark Mode (2 days)

**Sprint 2 (Week 3-4): Animations + Inline Editing**

- 1.2: Enhanced Animations (3 days)
- 1.5: Inline Editing (3 days)
- Testing and polish (2 days)

**Sprint 3 (Week 5-7): Productivity Core**

- 2.1: Recurring Tasks & Templates (5 days)
- 2.2: Calendar View (7 days)

**Continue sprints as planned...**

### Communication Plan

**Weekly Updates:**

- Every Monday: Sprint planning and review
- Daily standup notes (async via Slack)
- Demo completed features every Friday

**Documentation:**

- Update SYSTEM-ARCHITECTURE.md after each phase
- Create user-facing documentation (help docs)
- Maintain changelog in CHANGELOG.md

**Feedback Loop:**

- Collect user feedback via in-app widget
- Weekly review of feature requests
- Monthly retrospective on roadmap progress

---

## Appendix

### A. Glossary

- **Bottom Sheet:** Modal that slides up from bottom of screen (mobile UX pattern)
- **Cumulative Flow Diagram (CFD):** Stacked area chart showing work in progress over time
- **Glass Morphism:** UI design style with translucent backgrounds and blur effects
- **RRULE:** Recurrence rule format (RFC 5545) for defining repeating events
- **Safe Area:** iOS device area that avoids notch, home indicator, etc.
- **tRPC:** Type-safe RPC framework for TypeScript
- **Virtual Scrolling:** Rendering only visible items in long lists for performance

### B. References

**Design Inspiration:**

- Linear (keyboard shortcuts, command palette)
- Notion (inline editing, databases)
- Todoist (recurring tasks, natural language)
- Asana (calendar view, project templates)
- Height (AI features, insights)

**Technical Resources:**

- [react-big-calendar docs](https://jquense.github.io/react-big-calendar/examples/index.html)
- [Slack API documentation](https://api.slack.com/)
- [RFC 5545 (iCalendar)](https://tools.ietf.org/html/rfc5545)
- [Recharts examples](https://recharts.org/en-US/examples)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

### C. Change Log

**v1.0.0 - October 30, 2025**

- Initial roadmap created
- All 5 phases defined with 13 sprints
- Mobile-first enhancements prioritized
- Windows keyboard shortcuts specified
- Slack integration simplified
- Removed: Time tracking, Pomodoro, Tags, Team features, Exports

---

**Document Status:** ✅ Approved  
**Next Review:** After Sprint 3 completion  
**Owner:** Development Team  
**Stakeholders:** Product, Engineering, Design
