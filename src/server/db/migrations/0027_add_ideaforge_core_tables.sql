-- Core IdeaForge tables (embedded ideation layer)
CREATE TABLE IF NOT EXISTS ideaforge_ideas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    one_liner text,
    notes text,
    status text NOT NULL DEFAULT 'INBOX' CHECK (status IN ('INBOX','EXPLORING','VALIDATING','PLANNED','EXECUTING','ARCHIVED')),
    last_explored_at timestamp,
    last_committed_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideaforge_transcripts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idea_id uuid NOT NULL REFERENCES ideaforge_ideas(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user','assistant')),
    mode text NOT NULL DEFAULT 'text' CHECK (mode IN ('text','voice')),
    ai_mode text NOT NULL CHECK (ai_mode IN ('freeform','guided','critical')),
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideaforge_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idea_id uuid NOT NULL REFERENCES ideaforge_ideas(id) ON DELETE CASCADE,
    version integer NOT NULL,
    schedule_mode text NOT NULL CHECK (schedule_mode IN ('realistic','aggressive','deadline')),
    snapshot jsonb,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideaforge_plan_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES ideaforge_plans(id) ON DELETE CASCADE,
    idea_id uuid NOT NULL REFERENCES ideaforge_ideas(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    priority integer,
    budget_planned decimal,
    due_date date,
    dependencies text,
    project_id uuid REFERENCES projects(id),
    sprint_id uuid REFERENCES sprints(id),
    sprint_week_id uuid REFERENCES sprint_weeks(id),
    opportunity_id uuid REFERENCES opportunities(id),
    task_id uuid REFERENCES tasks(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideaforge_task_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_task_id uuid NOT NULL REFERENCES ideaforge_plan_tasks(id) ON DELETE CASCADE,
    content text NOT NULL,
    source text NOT NULL DEFAULT 'ideaforge' CHECK (source IN ('ideaforge','tasktraker')),
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideaforge_user_memory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideaforge_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idea_id uuid REFERENCES ideaforge_ideas(id),
    plan_task_id uuid REFERENCES ideaforge_plan_tasks(id),
    type text NOT NULL CHECK (type IN ('due_soon','overdue','stalled')),
    window_key text,
    read_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideaforge_sync_cursors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cursor_type text NOT NULL DEFAULT 'tasks' CHECK (cursor_type IN ('tasks','notifications')),
    last_value timestamp,
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ideaforge_ideas_user_id_idx ON ideaforge_ideas(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_ideas_status_idx ON ideaforge_ideas(status);
CREATE INDEX IF NOT EXISTS ideaforge_transcripts_user_id_idx ON ideaforge_transcripts(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_transcripts_idea_id_idx ON ideaforge_transcripts(idea_id);
CREATE INDEX IF NOT EXISTS ideaforge_plans_user_id_idx ON ideaforge_plans(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_plans_idea_id_idx ON ideaforge_plans(idea_id);
CREATE INDEX IF NOT EXISTS ideaforge_plan_tasks_user_id_idx ON ideaforge_plan_tasks(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_plan_tasks_plan_id_idx ON ideaforge_plan_tasks(plan_id);
CREATE INDEX IF NOT EXISTS ideaforge_plan_tasks_idea_id_idx ON ideaforge_plan_tasks(idea_id);
CREATE INDEX IF NOT EXISTS ideaforge_task_notes_user_id_idx ON ideaforge_task_notes(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_task_notes_plan_task_id_idx ON ideaforge_task_notes(plan_task_id);
CREATE INDEX IF NOT EXISTS ideaforge_user_memory_user_id_idx ON ideaforge_user_memory(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_notifications_user_id_idx ON ideaforge_notifications(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_notifications_type_idx ON ideaforge_notifications(type);
CREATE INDEX IF NOT EXISTS ideaforge_sync_cursors_user_id_idx ON ideaforge_sync_cursors(user_id);

-- Enable RLS
ALTER TABLE ideaforge_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_sync_cursors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own ideaforge ideas"
ON ideaforge_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge ideas"
ON ideaforge_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge ideas"
ON ideaforge_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge ideas"
ON ideaforge_ideas FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ideaforge transcripts"
ON ideaforge_transcripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge transcripts"
ON ideaforge_transcripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge transcripts"
ON ideaforge_transcripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge transcripts"
ON ideaforge_transcripts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ideaforge plans"
ON ideaforge_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge plans"
ON ideaforge_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge plans"
ON ideaforge_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge plans"
ON ideaforge_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ideaforge plan tasks"
ON ideaforge_plan_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge plan tasks"
ON ideaforge_plan_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge plan tasks"
ON ideaforge_plan_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge plan tasks"
ON ideaforge_plan_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ideaforge task notes"
ON ideaforge_task_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge task notes"
ON ideaforge_task_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge task notes"
ON ideaforge_task_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge task notes"
ON ideaforge_task_notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ideaforge memory"
ON ideaforge_user_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge memory"
ON ideaforge_user_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge memory"
ON ideaforge_user_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge memory"
ON ideaforge_user_memory FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ideaforge notifications"
ON ideaforge_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge notifications"
ON ideaforge_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge notifications"
ON ideaforge_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge notifications"
ON ideaforge_notifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ideaforge sync cursors"
ON ideaforge_sync_cursors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideaforge sync cursors"
ON ideaforge_sync_cursors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideaforge sync cursors"
ON ideaforge_sync_cursors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideaforge sync cursors"
ON ideaforge_sync_cursors FOR DELETE USING (auth.uid() = user_id);
