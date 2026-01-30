-- Integration API keys table (server-to-server auth)
CREATE TABLE IF NOT EXISTS integration_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    integration text NOT NULL CHECK (integration IN ('ideaforge')),
    key_hash text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    last_used_at timestamp,
    revoked_at timestamp
);

-- IdeaForge sync mapping table
CREATE TABLE IF NOT EXISTS ideaforge_sync_map (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idea_id text NOT NULL,
    plan_version text NOT NULL,
    plan_task_id text NOT NULL,
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id),
    sprint_id uuid REFERENCES sprints(id),
    sprint_week_id uuid REFERENCES sprint_weeks(id),
    opportunity_id uuid REFERENCES opportunities(id),
    last_sync_at timestamp NOT NULL DEFAULT now(),
    last_change_source text NOT NULL DEFAULT 'idea_app' CHECK (last_change_source IN ('idea_app', 'task_app')),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Indexes for integration tables
CREATE INDEX IF NOT EXISTS integration_api_keys_user_id_idx ON integration_api_keys(user_id);
CREATE INDEX IF NOT EXISTS integration_api_keys_key_hash_idx ON integration_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS ideaforge_sync_map_user_id_idx ON ideaforge_sync_map(user_id);
CREATE INDEX IF NOT EXISTS ideaforge_sync_map_idea_id_idx ON ideaforge_sync_map(idea_id);
CREATE INDEX IF NOT EXISTS ideaforge_sync_map_plan_task_id_idx ON ideaforge_sync_map(plan_task_id);
CREATE INDEX IF NOT EXISTS ideaforge_sync_map_task_id_idx ON ideaforge_sync_map(task_id);

-- Add source to task comments for append-only integration notes
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS source text DEFAULT 'app';
UPDATE task_comments SET source = 'app' WHERE source IS NULL;
ALTER TABLE task_comments ALTER COLUMN source SET NOT NULL;

-- Enable RLS and policies for integration tables
ALTER TABLE integration_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideaforge_sync_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integration keys"
ON integration_api_keys
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integration keys"
ON integration_api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration keys"
ON integration_api_keys
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integration keys"
ON integration_api_keys
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own IdeaForge sync map"
ON ideaforge_sync_map
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own IdeaForge sync map"
ON ideaforge_sync_map
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IdeaForge sync map"
ON ideaforge_sync_map
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IdeaForge sync map"
ON ideaforge_sync_map
FOR DELETE
USING (auth.uid() = user_id);
