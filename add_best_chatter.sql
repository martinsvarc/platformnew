-- Create best_chatter_challenge table
CREATE TABLE IF NOT EXISTS best_chatter_challenge (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  description_text text,
  media_url text,
  end_time timestamptz not null,
  start_time timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_best_chatter_challenge_updated_at ON best_chatter_challenge;
CREATE TRIGGER set_best_chatter_challenge_updated_at 
  BEFORE UPDATE ON best_chatter_challenge 
  FOR EACH ROW 
  EXECUTE PROCEDURE set_updated_at();
