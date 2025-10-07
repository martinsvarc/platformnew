-- Create app_settings table for storing application-wide settings
create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  setting_key text not null,
  setting_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure one setting per key per team
create unique index if not exists app_settings_team_key_unique on app_settings(team_id, setting_key);

-- Add trigger for updated_at
drop trigger if exists set_app_settings_updated_at on app_settings;
create trigger set_app_settings_updated_at before update on app_settings for each row execute procedure set_updated_at();

-- Optional: Insert default background URL if needed
-- INSERT INTO app_settings (team_id, setting_key, setting_value) 
-- VALUES ('your-team-id', 'background_url', 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77bea777fb41bf5438086e_ubbh2h.jpg')
-- ON CONFLICT (team_id, setting_key) DO NOTHING;

