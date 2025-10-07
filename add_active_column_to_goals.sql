-- Add active column to goals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'active'
  ) THEN
    ALTER TABLE goals ADD COLUMN active boolean NOT NULL DEFAULT true;
    RAISE NOTICE 'Added active column to goals table';
  ELSE
    RAISE NOTICE 'Active column already exists in goals table';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'goals' AND column_name = 'active';

