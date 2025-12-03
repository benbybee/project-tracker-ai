-- Migration: Add notes table for text and audio notes with AI task generation
-- Created: 2025-01-27

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'text' CHECK (note_type IN ('text', 'audio')),
  audio_url TEXT,
  audio_duration INTEGER,
  tasks_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for querying user's notes
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);

-- Index for querying notes by project
CREATE INDEX IF NOT EXISTS notes_project_id_idx ON notes(project_id);

-- Index for querying notes by creation date
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);

-- Index for querying notes by type
CREATE INDEX IF NOT EXISTS notes_note_type_idx ON notes(note_type);

