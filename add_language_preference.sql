-- Add language preference column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'cs';

-- Add comment
COMMENT ON COLUMN users.language IS 'User preferred language (cs for Czech, en for English)';

