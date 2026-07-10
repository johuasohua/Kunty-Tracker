-- Goals table for the two-threshold cash deployment waterfall model
-- Goals share the household dataset (both Josh & Kiki see and manage all goals).
-- Once surplus cash exceeds 200k in savings, it gets allocated toward goals
-- in priority order. Reached status is tracked for one-time celebration insight.

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(14, 2) not null,
  priority_order integer not null default 0,    -- 0 = highest priority; order by asc
  target_date date,                              -- optional target completion date
  reached_at timestamptz,                        -- populated once target_amount allocated; used for one-time insight
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_priority_idx on goals (priority_order asc, id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table goals enable row level security;

create policy "household read" on goals for select using (auth.role() = 'authenticated');
create policy "household write" on goals for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- updated_at trigger for goals
-- ---------------------------------------------------------------------------
drop trigger if exists goals_set_updated_at on goals;
create trigger goals_set_updated_at
  before update on goals
  for each row execute function set_updated_at();
