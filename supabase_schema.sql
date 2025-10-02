-- Francoflex Supabase Database Schema
-- Run this in your Supabase SQL Editor to create all required tables

-- 1. User Preferences Table
CREATE TABLE IF NOT EXISTS preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user UUID NOT NULL UNIQUE,
  learning TEXT NOT NULL,
  native TEXT NOT NULL,
  industry TEXT,
  job TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_preferences_user ON preferences(user);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user UUID NOT NULL,
  level TEXT NOT NULL,
  type TEXT DEFAULT 'repeat',
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author TEXT NOT NULL CHECK (author IN ('system', 'user')),
  session UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 4. Pronunciation Analysis Table
CREATE TABLE IF NOT EXISTS pronunciation_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user UUID NOT NULL,
  type TEXT DEFAULT 'repeat',
  level TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pronunciation_analysis_user ON pronunciation_analysis(user);
CREATE INDEX IF NOT EXISTS idx_pronunciation_analysis_created_at ON pronunciation_analysis(created_at DESC);

-- 5. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_analysis ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Allow authenticated users to access their own data
-- Preferences policies
CREATE POLICY "Users can view their own preferences"
  ON preferences FOR SELECT
  USING (auth.uid() = user);

CREATE POLICY "Users can insert their own preferences"
  ON preferences FOR INSERT
  WITH CHECK (auth.uid() = user);

CREATE POLICY "Users can update their own preferences"
  ON preferences FOR UPDATE
  USING (auth.uid() = user);

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user);

CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user);

CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user);

-- Messages policies (messages belong to sessions which belong to users)
CREATE POLICY "Users can view messages from their sessions"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sessions WHERE sessions.id = messages.session AND sessions.user = auth.uid()
  ));

CREATE POLICY "Users can insert messages to their sessions"
  ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions WHERE sessions.id = messages.session AND sessions.user = auth.uid()
  ));

-- Pronunciation Analysis policies
CREATE POLICY "Users can view their own pronunciation analyses"
  ON pronunciation_analysis FOR SELECT
  USING (auth.uid() = user);

CREATE POLICY "Users can insert their own pronunciation analyses"
  ON pronunciation_analysis FOR INSERT
  WITH CHECK (auth.uid() = user);

-- 7. Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Add triggers to auto-update updated_at
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! All tables created successfully.
