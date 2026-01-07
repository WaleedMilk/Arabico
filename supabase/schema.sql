-- Arabico Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vocabulary table: stores word familiarity for each user (with SRS fields)
CREATE TABLE IF NOT EXISTS vocabulary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    word_id TEXT NOT NULL,
    surface_form TEXT NOT NULL,
    lemma TEXT NOT NULL,
    root TEXT,
    gloss TEXT NOT NULL,
    frequency_rank INTEGER DEFAULT 0,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    familiarity TEXT CHECK (familiarity IN ('new', 'seen', 'learning', 'known', 'ignored')) DEFAULT 'new',
    last_reviewed TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,

    -- SRS Algorithm Fields
    ease_factor DECIMAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    next_review_date TIMESTAMPTZ,
    consecutive_correct INTEGER DEFAULT 0,
    difficulty_score DECIMAL DEFAULT 0.5,

    -- Learning Context (stored as JSONB)
    encounter_locations JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint for user + word combination
    UNIQUE(user_id, word_id)
);

-- Reading progress table: tracks where each user left off
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    surah_id INTEGER NOT NULL CHECK (surah_id >= 1 AND surah_id <= 114),
    last_ayah INTEGER NOT NULL DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint for user + surah combination
    UNIQUE(user_id, surah_id)
);

-- User settings table: stores preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
    font_size INTEGER DEFAULT 24 CHECK (font_size >= 12 AND font_size <= 48),
    show_transliteration BOOLEAN DEFAULT TRUE,
    show_translation BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review sessions table: tracks each review session
CREATE TABLE IF NOT EXISTS review_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT CHECK (mode IN ('contextual', 'quick', 'recognition', 'recall')) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    words_reviewed INTEGER DEFAULT 0,
    words_correct INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0, -- milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User engagement table: tracks streaks and progress
CREATE TABLE IF NOT EXISTS user_engagement (
    user_id TEXT PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_review_date DATE,
    total_words_reviewed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word_id ON vocabulary(word_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_familiarity ON vocabulary(familiarity);
CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON vocabulary(next_review_date);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user_id ON review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_start_time ON review_sessions(start_time);

-- Enable Row Level Security (RLS)
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for now (using anonymous IDs)
-- For vocabulary table
CREATE POLICY "Allow all vocabulary operations" ON vocabulary
    FOR ALL USING (true) WITH CHECK (true);

-- For reading_progress table
CREATE POLICY "Allow all reading_progress operations" ON reading_progress
    FOR ALL USING (true) WITH CHECK (true);

-- For user_settings table
CREATE POLICY "Allow all user_settings operations" ON user_settings
    FOR ALL USING (true) WITH CHECK (true);

-- For review_sessions table
CREATE POLICY "Allow all review_sessions operations" ON review_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- For user_engagement table
CREATE POLICY "Allow all user_engagement operations" ON user_engagement
    FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_vocabulary_updated_at ON vocabulary;
CREATE TRIGGER update_vocabulary_updated_at
    BEFORE UPDATE ON vocabulary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reading_progress_updated_at ON reading_progress;
CREATE TRIGGER update_reading_progress_updated_at
    BEFORE UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_engagement_updated_at ON user_engagement;
CREATE TRIGGER update_user_engagement_updated_at
    BEFORE UPDATE ON user_engagement
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
