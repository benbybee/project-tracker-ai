-- AI Chat Sessions Tables Migration
-- Adds support for persistent AI chat sessions with message history

-- AI Chat Sessions table
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Chat Messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_last_message_at ON ai_chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_created_at ON ai_chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_is_active ON ai_chat_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at ASC);

-- Comments for documentation
COMMENT ON TABLE ai_chat_sessions IS 'Stores AI chat sessions for users with automatic 48-hour cleanup';
COMMENT ON TABLE ai_chat_messages IS 'Stores individual messages within AI chat sessions';
COMMENT ON COLUMN ai_chat_sessions.title IS 'Auto-generated from first message, truncated to 50 characters';
COMMENT ON COLUMN ai_chat_sessions.last_message_at IS 'Updated whenever a new message is added to track recent activity';
COMMENT ON COLUMN ai_chat_messages.metadata IS 'Stores tool call data, confirmations, and other message-specific data';

