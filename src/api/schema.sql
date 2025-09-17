-- Extensions
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- Enums
do $$ begin
  create type user_role as enum ('admin','manager','member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_period as enum ('daily','weekly','monthly','custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_metric as enum ('amount','count');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','completed','refunded','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('bank','card','cash','other');
exception when duplicate_object then null; end $$;

-- Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  username citext not null,
  email citext unique,
  display_name text,
  avatar_url text,
  status text,
  role user_role not null default 'member',
  password_hash text not null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists users_team_username_unique on users(team_id, username);
create index if not exists users_team_id_idx on users(team_id);

-- Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  email citext,
  phone text,
  vyplata text,
  notes text,
  owner_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists clients_team_email_unique on clients(team_id, email) where email is not null;
create unique index if not exists clients_team_phone_unique on clients(team_id, phone) where phone is not null;
create index if not exists clients_team_id_idx on clients(team_id);
create index if not exists clients_name_trgm_idx on clients using gin (name gin_trgm_ops);

-- Payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  paid_at timestamptz not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'CZK' check (char_length(currency) = 3),
  prodano text,
  platforma text,
  model text,
  banka text,
  status payment_status not null default 'completed',
  method payment_method,
  reference text,
  fee_amount numeric(12,2) default 0 check (fee_amount >= 0),
  net_amount numeric(12,2) generated always as (amount - fee_amount) stored,
  paid_date date generated always as (paid_at::date) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_team_paid_date_idx on payments(team_id, paid_date);
create index if not exists payments_team_user_paid_at_idx on payments(team_id, user_id, paid_at);
create index if not exists payments_client_id_idx on payments(client_id);

-- Goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  name text not null,
  period goal_period not null,
  metric goal_metric not null default 'amount',
  target_value numeric(12,2) not null check (target_value >= 0),
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date <= end_date)
);

create index if not exists goals_active_team_idx on goals(team_id, start_date, end_date) where active = true;

-- Trigger: set_updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on users;
create trigger set_users_updated_at before update on users for each row execute procedure set_updated_at();

drop trigger if exists set_clients_updated_at on clients;
create trigger set_clients_updated_at before update on clients for each row execute procedure set_updated_at();

drop trigger if exists set_payments_updated_at on payments;
create trigger set_payments_updated_at before update on payments for each row execute procedure set_updated_at();

drop trigger if exists set_goals_updated_at on goals;
create trigger set_goals_updated_at before update on goals for each row execute procedure set_updated_at();


