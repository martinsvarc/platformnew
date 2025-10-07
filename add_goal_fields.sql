-- Add description_text and media_url columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description_text text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS media_url text;
