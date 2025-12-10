-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    goal_summary text,
    is_active boolean DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Create sprint_weeks table
CREATE TABLE IF NOT EXISTS sprint_weeks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    week_index integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    theme text,
    notes text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sprint_id uuid REFERENCES sprints(id),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('MAJOR', 'MICRO')),
    lane text,
    summary text,
    complexity text,
    estimated_cost numeric,
    go_to_market text,
    details text,
    status text NOT NULL DEFAULT 'IDEA' CHECK (status IN ('IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'KILLED')),
    priority integer DEFAULT 3,
    notes text,
    -- Performance fields (for completed)
    actual_cost numeric,
    revenue numeric,
    profit numeric,
    decision text DEFAULT 'UNDECIDED' CHECK (decision IN ('KEEP', 'ADJUST', 'CANCEL', 'UNDECIDED')),
    outcome_notes text,
    completed_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Add Pattern 4 fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES sprints(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_week_id uuid REFERENCES sprint_weeks(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES opportunities(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority integer;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget_planned numeric;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget_spent numeric;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS sprint_weeks_sprint_id_idx ON sprint_weeks(sprint_id);
CREATE INDEX IF NOT EXISTS opportunities_user_id_idx ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS opportunities_sprint_id_idx ON opportunities(sprint_id);
CREATE INDEX IF NOT EXISTS opportunities_status_idx ON opportunities(status);
CREATE INDEX IF NOT EXISTS tasks_sprint_id_idx ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS tasks_sprint_week_id_idx ON tasks(sprint_week_id);
CREATE INDEX IF NOT EXISTS tasks_opportunity_id_idx ON tasks(opportunity_id);

