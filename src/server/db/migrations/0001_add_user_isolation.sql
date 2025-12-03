-- Migration: Add userId to tables for data isolation
-- This is a CRITICAL security fix to ensure users only see their own data

-- Step 1: Add name field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 2: Add userId to roles table
-- First, add the column as nullable
ALTER TABLE roles ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing roles to belong to the first user (or you can assign manually)
-- You'll need to update this with actual user IDs from your database
UPDATE roles SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- Make it NOT NULL and add foreign key
ALTER TABLE roles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE roles ADD CONSTRAINT roles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Drop the unique constraint on name since names should be unique per user
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_key;

-- Step 3: Add userId to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing projects to belong to the first user
UPDATE projects SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- Make it NOT NULL and add foreign key
ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Add userId to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing tasks to belong to the first user
UPDATE tasks SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- Make it NOT NULL and add foreign key
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Add indices for performance (critical for filtering by userId)
CREATE INDEX IF NOT EXISTS idx_roles_user_id ON roles(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_user ON tasks(project_id, user_id);

-- Note: After running this migration, you MUST update your application code
-- to filter all queries by userId to ensure proper data isolation!

