-- Migration: Enable Multi-Team Accounts
-- This allows one email/username to have multiple team profiles
-- Author: System
-- Date: 2025-10-10

-- Remove UNIQUE constraint on email in users table
-- This allows the same email to be used across different teams
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Create a partial unique index instead that only applies to non-null emails within the same team
-- This prevents duplicate emails within a single team but allows the same email across different teams
DROP INDEX IF EXISTS users_email_team_unique;
CREATE UNIQUE INDEX users_email_team_unique ON users(team_id, email) WHERE email IS NOT NULL AND deleted_at IS NULL;

-- Add index to speed up email lookups across teams
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email) WHERE email IS NOT NULL;

-- Add comments to document the multi-team feature
COMMENT ON TABLE users IS 'Users can have multiple profiles across different teams with the same email. The username is unique per team, but email can be shared across teams for multi-team accounts.';

-- Optional: Add a helper function to get all teams for an email
CREATE OR REPLACE FUNCTION get_user_teams(user_email text) 
RETURNS TABLE (
  user_id uuid,
  team_id uuid,
  team_name text,
  team_slug text,
  username text,
  display_name text,
  avatar_url text,
  role user_role,
  status text,
  last_login_at timestamptz
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    u.id as user_id,
    u.team_id,
    t.name as team_name,
    t.slug as team_slug,
    u.username,
    u.display_name,
    u.avatar_url,
    u.role,
    u.status,
    u.last_login_at
  FROM users u
  JOIN teams t ON u.team_id = t.id
  WHERE u.email = user_email
    AND u.deleted_at IS NULL
    AND u.status IN ('active', 'pending')
  ORDER BY u.last_login_at DESC NULLS LAST;
$$;

COMMENT ON FUNCTION get_user_teams IS 'Returns all team profiles for a given email address, ordered by most recently used';

