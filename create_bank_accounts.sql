-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS bank_accounts_team_name_unique ON bank_accounts(team_id, name) WHERE active = true;
CREATE INDEX IF NOT EXISTS bank_accounts_team_id_idx ON bank_accounts(team_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER set_bank_accounts_updated_at 
  BEFORE UPDATE ON bank_accounts 
  FOR EACH ROW 
  EXECUTE PROCEDURE set_updated_at();

