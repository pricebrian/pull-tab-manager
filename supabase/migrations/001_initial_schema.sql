-- Pull Tab Manager - Initial Schema
-- Tables: jobs, deals, app_settings

-- App settings (key-value store for configurable values)
create table app_settings (
  key text primary key,
  value text not null
);

-- Seed the starting serial number (configurable in Settings page later)
insert into app_settings (key, value) values ('next_serial', '1');

-- Jobs table
create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text unique not null,
  customer text not null,
  due_date date,
  notes text,
  stage text not null default 'Art'
    check (stage in ('Art', 'Imposing', 'Printing', 'Gluing', 'Die Cut', 'Packing', 'Shipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deals table (each job has one or more deals)
create table deals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  serial integer unique not null,
  game_name text not null,
  sku text,
  ticket_mode text not null default '5w' check (ticket_mode in ('5w', '3w')),
  tickets_per_deal integer not null default 0,
  price numeric(10,2) not null default 0,
  payout numeric(10,2) not null default 0,
  sheets_in integer not null default 0,
  glue_damage integer not null default 0,
  cut_damage integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for querying deals by job
create index idx_deals_job_id on deals(job_id);

-- Index for serial lookups (scanner page will need this later)
create index idx_deals_serial on deals(serial);

-- Function to atomically claim N serial numbers and return the starting serial
create or replace function claim_serials(count integer)
returns integer
language plpgsql
as $$
declare
  current_val integer;
begin
  -- Lock the row and get current value
  select value::integer into current_val
  from app_settings
  where key = 'next_serial'
  for update;

  -- Increment by count
  update app_settings
  set value = (current_val + count)::text
  where key = 'next_serial';

  return current_val;
end;
$$;

-- Function to update the updated_at timestamp on jobs
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_updated_at
  before update on jobs
  for each row
  execute function update_updated_at();
