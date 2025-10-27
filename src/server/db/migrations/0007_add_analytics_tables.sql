-- Analytics Tables Migration
-- Task completion analytics - tracks actual time spent on tasks
CREATE TABLE IF NOT EXISTS task_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_duration_minutes INTEGER,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User productivity patterns - learned patterns for personalization
CREATE TABLE IF NOT EXISTS user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('completion_time', 'productive_hours', 'task_category_duration', 'postponement_pattern', 'velocity')),
  pattern_data JSONB NOT NULL,
  confidence_score REAL,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AI suggestions log - tracks what the AI suggests and user acceptance
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('daily_plan', 'task_priority', 'time_estimate', 'schedule', 'focus_block', 'break_reminder')),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  suggestion_data JSONB NOT NULL,
  accepted JSONB,
  feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_analytics_user_id ON task_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_task_analytics_task_id ON task_analytics(task_id);
CREATE INDEX IF NOT EXISTS idx_task_analytics_completed_at ON task_analytics(completed_at);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_pattern_type ON user_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_task_id ON ai_suggestions(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at);

-- Add helpful comments
COMMENT ON TABLE task_analytics IS 'Tracks actual time spent completing tasks for learning user patterns';
COMMENT ON TABLE user_patterns IS 'Stores learned productivity patterns for AI personalization';
COMMENT ON TABLE ai_suggestions IS 'Logs AI suggestions and tracks user acceptance/rejection';

