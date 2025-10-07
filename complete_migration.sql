-- ============================================
-- Complete Database Migration
-- For Goal Features + Best Chatter Challenge
-- ============================================

-- 1. Add description_text and media_url to goals table
-- (For daily/weekly/monthly goal custom text and media)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description_text text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS media_url text;

-- 2. Create best_chatter_challenge table
CREATE TABLE IF NOT EXISTS best_chatter_challenge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  description_text text,
  media_url text,
  end_time timestamptz NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add updated_at trigger for best_chatter_challenge
DROP TRIGGER IF EXISTS set_best_chatter_challenge_updated_at ON best_chatter_challenge;
CREATE TRIGGER set_best_chatter_challenge_updated_at 
  BEFORE UPDATE ON best_chatter_challenge 
  FOR EACH ROW 
  EXECUTE PROCEDURE set_updated_at();

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS best_chatter_challenge_team_active_idx 
  ON best_chatter_challenge(team_id, active) 
  WHERE active = true;

-- ============================================
-- Verification Queries (optional - uncomment to run)
-- ============================================

-- Check if columns were added to goals table
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'goals' 
-- AND column_name IN ('description_text', 'media_url');

-- Check if best_chatter_challenge table exists
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name = 'best_chatter_challenge';

-- ============================================
-- Complete! Your database is now ready.
-- ============================================

