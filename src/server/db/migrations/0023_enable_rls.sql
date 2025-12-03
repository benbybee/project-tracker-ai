-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
USING (auth.uid() = id);

-- Projects Policies
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can view their own tasks"
ON tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Notes Policies
CREATE POLICY "Users can view their own notes"
ON notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
ON notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON notes
FOR DELETE
USING (auth.uid() = user_id);

