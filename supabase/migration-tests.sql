-- Test configurations table for vocabulary testing
CREATE TABLE IF NOT EXISTS test_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  title TEXT,
  surah_start INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  surah_end INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  specific_ayahs JSONB,
  word_ids TEXT[] NOT NULL,
  word_count INTEGER NOT NULL,
  test_mode TEXT DEFAULT 'flashcard',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anyone can read tests (for shared links), authenticated users can create
ALTER TABLE test_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read test configs" ON test_configs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tests" ON test_configs FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_test_configs_creator ON test_configs(creator_id);
